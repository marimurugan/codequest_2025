package com.ai.aws_bedrock_agent_connector.controller;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ai.aws_bedrock_agent_connector.service.BedrockAgentService;

@RestController
@RequestMapping("/bedrock")
public class BedrockAgentController {

    @Autowired
    private BedrockAgentService agentService;

    @PostMapping("/ask")
    public ResponseEntity<String> askAgent(@RequestBody String message) throws InterruptedException, ExecutionException, TimeoutException {
        String reply = agentService.invokeAgentAsync(message);
        return ResponseEntity.ok(reply);
    }
}
