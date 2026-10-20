package com.springboot.ai_verify.entitlement.config;

import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "app.plans")
public class PlanProperties {

    private Map<String, PlanDefinition> catalog = new HashMap<>();

    public Map<String, PlanDefinition> getCatalog() {
        return catalog;
    }

    public void setCatalog(Map<String, PlanDefinition> catalog) {
        this.catalog = catalog;
    }
}
