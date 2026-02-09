package com.oxfield.services.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Configuração para processamento assíncrono.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Configuração padrão do Spring async
    // TODO: Customizar TaskExecutor se necessário
}
