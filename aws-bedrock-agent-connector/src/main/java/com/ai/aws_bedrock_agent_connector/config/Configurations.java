package com.ai.aws_bedrock_agent_connector.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.services.bedrockagentruntime.BedrockAgentRuntimeClient;
import software.amazon.awssdk.regions.Region;
@Configuration
public class Configurations {
	
	@Bean
	public BedrockAgentRuntimeClient bedrockClient() {
	    return BedrockAgentRuntimeClient.builder()
	        .region(Region.US_EAST_1) // or your region
	        .build();
	}

}
