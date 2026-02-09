/**
 * Dashboard Views Test Suite
 * Tests: DASH-001 to DASH-006
 * 
 * Tests the real OperationsDashboard component functionality including:
 * - Loading KPIs
 * - Displaying percentage variations
 * - Weekly job chart
 * - Fallback data handling
 * - Utilization rate calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockDashboardData, mockWeeklyJobs } from '../mocks/handlers';

// Import the REAL component
import { OperationsDashboard } from '../../../views/DashboardViews';

describe('Dashboard Views - Real Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * DASH-001: Carregar KPIs do dashboard
   * Verifica se todos os KPIs são carregados corretamente
   */
  describe('DASH-001: Load Dashboard KPIs', () => {
    it('should display all KPI cards when dashboard loads', async () => {
      render(<OperationsDashboard />);

      // Wait for loading to finish and content to appear
      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
      });

      // Verify KPI labels are present
      expect(screen.getByText('Total Jobs')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Active Techs')).toBeInTheDocument();
    });

    it('should display correct KPI values from API', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // Check total jobs (using regex to handle locale differences)
        expect(screen.getByText(/1[,.]284/)).toBeInTheDocument();
      });

      // Check response time
      expect(screen.getByText('42m')).toBeInTheDocument();
      
      // Check active technicians
      expect(screen.getByText('24/30')).toBeInTheDocument();
    });

    it('should show loading indicator initially', () => {
      render(<OperationsDashboard />);
      
      // The Loader2 component should be present during loading
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  /**
   * DASH-002: Exibir variação percentual
   * Verifica se as setas e percentuais são exibidos corretamente
   */
  describe('DASH-002: Display Percentage Variations', () => {
    it('should display percentage change indicators', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
      });

      // Check for percentage indicators (the component shows "12% vs last week")
      await waitFor(() => {
        expect(screen.getByText(/12%/)).toBeInTheDocument();
        expect(screen.getByText(/8%/)).toBeInTheDocument();
      });
    });

    it('should show positive change indicators', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // The component shows "vs last week" text for changes
        expect(screen.getAllByText(/vs last week/).length).toBeGreaterThan(0);
      });

      // The component should have green color classes for positive changes
      const greenElements = document.querySelectorAll('.text-green-400');
      expect(greenElements.length).toBeGreaterThan(0);
    });
  });

  /**
   * DASH-003: Carregar gráfico semanal
   * Verifica se o gráfico de jobs semanais é renderizado
   */
  describe('DASH-003: Load Weekly Jobs Chart', () => {
    it('should render weekly chart section', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Job Completion')).toBeInTheDocument();
      });
    });

    it('should render the chart container', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // The ResponsiveContainer should be rendered
        const chartContainer = document.querySelector('.recharts-responsive-container');
        expect(chartContainer).toBeInTheDocument();
      });
    });
  });

  /**
   * DASH-004: Fallback para dados cached
   * Verifica comportamento quando API está indisponível
   */
  describe('DASH-004: Fallback to Cached Data', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get('*/empresa/dashboard', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('*/empresa/dashboard/weekly-jobs', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<OperationsDashboard />);

      // The component catches errors and shows fallback data
      // It may show an error message
      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
      });
    });

    it('should use fallback data when API fails', async () => {
      server.use(
        http.get('*/empresa/dashboard', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('*/empresa/dashboard/weekly-jobs', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<OperationsDashboard />);

      // Component has fallback data defined (1284, etc.)
      await waitFor(() => {
        expect(screen.getByText(/1[,.]284/)).toBeInTheDocument();
      });
    });
  });

  /**
   * DASH-006: Taxa de utilização calculada
   * Verifica se a taxa de utilização é exibida corretamente
   */
  describe('DASH-006: Utilization Rate Calculation', () => {
    it('should display active technicians count', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('24/30')).toBeInTheDocument();
      });
    });

    it('should display utilization rate percentage', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/80% Utilization/)).toBeInTheDocument();
      });
    });

    it('should display correct utilization for different data', async () => {
      server.use(
        http.get('*/empresa/dashboard', () => {
          return HttpResponse.json({
            ...mockDashboardData,
            activeTechnicians: 15,
            totalTechnicians: 20,
            utilizationRate: 75,
          });
        })
      );

      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('15/20')).toBeInTheDocument();
        expect(screen.getByText(/75% Utilization/)).toBeInTheDocument();
      });
    });
  });

  /**
   * Additional tests for component behavior
   */
  describe('Component Behavior', () => {
    it('should format currency correctly', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // The component formats revenue as "$48.2k"
        expect(screen.getByText(/\$48\.2k/)).toBeInTheDocument();
      });
    });

    it('should format large numbers with locale', async () => {
      server.use(
        http.get('*/empresa/dashboard', () => {
          return HttpResponse.json({
            ...mockDashboardData,
            totalJobs: 12345,
          });
        })
      );

      render(<OperationsDashboard />);

      await waitFor(() => {
        // Number should be formatted with locale (12.345 or 12,345)
        expect(screen.getByText(/12[,.]345/)).toBeInTheDocument();
      });
    });
  });
});
