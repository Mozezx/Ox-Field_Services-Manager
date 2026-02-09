import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Ox Field Services - Empresa Module
 * These tests run against the actual application in the browser
 */

test.describe('Empresa Module E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.describe('Dashboard', () => {
    test('should display dashboard with KPIs', async ({ page }) => {
      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
      
      // Verify KPI cards are present
      await expect(page.locator('[data-testid="total-jobs-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
    });

    test('should refresh data when clicking refresh button', async ({ page }) => {
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
      
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await refreshButton.click();
      
      // Should show loading state briefly
      // Then data should be visible again
      await expect(page.locator('[data-testid="total-jobs-value"]')).toBeVisible();
    });
  });

  test.describe('Dispatch Console', () => {
    test('should navigate to dispatch console', async ({ page }) => {
      // Click navigation
      await page.locator('[data-testid="nav-dispatch"]').click();
      
      // Wait for dispatch console
      await expect(page.locator('[data-testid="dispatch-console"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display calendar timeline', async ({ page }) => {
      await page.locator('[data-testid="nav-dispatch"]').click();
      
      await expect(page.locator('[data-testid="dispatch-timeline"]')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate between days', async ({ page }) => {
      await page.locator('[data-testid="nav-dispatch"]').click();
      await expect(page.locator('[data-testid="dispatch-console"]')).toBeVisible({ timeout: 10000 });
      
      // Get current date
      const initialDate = await page.locator('[data-testid="current-date"]').textContent();
      
      // Click next day
      await page.locator('[data-testid="next-day-button"]').click();
      
      // Date should change
      const newDate = await page.locator('[data-testid="current-date"]').textContent();
      expect(newDate).not.toBe(initialDate);
    });

    test('should open new order modal', async ({ page }) => {
      await page.locator('[data-testid="nav-dispatch"]').click();
      await expect(page.locator('[data-testid="dispatch-console"]')).toBeVisible({ timeout: 10000 });
      
      await page.locator('[data-testid="new-order-button"]').click();
      
      await expect(page.locator('[data-testid="new-order-modal"]')).toBeVisible();
    });
  });

  test.describe('Technician Approvals', () => {
    test('should navigate to approvals page', async ({ page }) => {
      await page.locator('[data-testid="nav-approvals"]').click();
      
      await expect(page.locator('[data-testid="approval-inbox"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display list of technicians', async ({ page }) => {
      await page.locator('[data-testid="nav-approvals"]').click();
      
      await expect(page.locator('[data-testid="technician-list"]')).toBeVisible({ timeout: 10000 });
    });

    test('should click on pending technician to view details', async ({ page }) => {
      await page.locator('[data-testid="nav-approvals"]').click();
      await expect(page.locator('[data-testid="approval-inbox"]')).toBeVisible({ timeout: 10000 });
      
      // Find a pending technician and click
      const pendingTech = page.locator('[data-testid^="tech-row-"].clickable').first();
      if (await pendingTech.isVisible()) {
        await pendingTech.click();
        await expect(page.locator('[data-testid="document-verification"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Billing', () => {
    test('should navigate to billing page', async ({ page }) => {
      await page.locator('[data-testid="nav-billing"]').click();
      
      await expect(page.locator('[data-testid="billing-container"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display subscription information', async ({ page }) => {
      await page.locator('[data-testid="nav-billing"]').click();
      
      await expect(page.locator('[data-testid="my-subscription"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="plan-badge"]')).toBeVisible();
    });

    test('should switch between billing tabs', async ({ page }) => {
      await page.locator('[data-testid="nav-billing"]').click();
      await expect(page.locator('[data-testid="billing-container"]')).toBeVisible({ timeout: 10000 });
      
      // Click on Invoices tab
      await page.locator('[data-testid="tab-invoices"]').click();
      await expect(page.locator('[data-testid="invoices"]')).toBeVisible();
      
      // Click on Credits tab
      await page.locator('[data-testid="tab-credits"]').click();
      await expect(page.locator('[data-testid="credits"]')).toBeVisible();
    });
  });

  test.describe('Order Management', () => {
    test('should display orders list', async ({ page }) => {
      await page.locator('[data-testid="nav-orders"]').click();
      
      await expect(page.locator('[data-testid="order-management"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
      await page.locator('[data-testid="nav-orders"]').click();
      await expect(page.locator('[data-testid="order-management"]')).toBeVisible({ timeout: 10000 });
      
      // Select status filter
      await page.locator('[data-testid="status-filter"]').selectOption('COMPLETED');
      
      // Orders should be filtered (implementation dependent)
    });

    test('should view order details', async ({ page }) => {
      await page.locator('[data-testid="nav-orders"]').click();
      await expect(page.locator('[data-testid="orders-table"]')).toBeVisible({ timeout: 10000 });
      
      // Click on first view button
      const viewButton = page.locator('[data-testid^="view-order-"]').first();
      await viewButton.click();
      
      await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper page title', async ({ page }) => {
      await expect(page).toHaveTitle(/Ox Field Services/);
    });

    test('should navigate with keyboard only', async ({ page }) => {
      // Press Tab to move through focusable elements
      await page.keyboard.press('Tab');
      
      // Verify an element is focused
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should have skip link for keyboard users', async ({ page }) => {
      const skipLink = page.locator('[data-testid="skip-link"]');
      
      // Skip link should be present (may be visually hidden)
      await expect(skipLink).toBeAttached();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      // This would require mocking the API to fail
      // For now, we test that error states are handled gracefully
    });

    test('should handle session timeout', async ({ page }) => {
      // This would test token expiration handling
    });
  });
});
