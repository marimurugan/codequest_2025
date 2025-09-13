package com.ai.aws_bedrock_agent_connector.service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.async.SdkPublisher;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockagentruntime.BedrockAgentRuntimeAsyncClient;
// If Input still missing, see below
import software.amazon.awssdk.services.bedrockagentruntime.model.InvokeAgentRequest;
import software.amazon.awssdk.services.bedrockagentruntime.model.InvokeAgentResponse;
import software.amazon.awssdk.services.bedrockagentruntime.model.InvokeAgentResponseHandler;
import software.amazon.awssdk.services.bedrockagentruntime.model.PayloadPart;
import software.amazon.awssdk.services.bedrockagentruntime.model.ResponseStream;

@Service
public class BedrockAgentService {

    private final BedrockAgentRuntimeAsyncClient asyncClient = BedrockAgentRuntimeAsyncClient.builder()
        .region(Region.US_EAST_1)
        .build();

    public String invokeAgentAsync(String userInput) throws InterruptedException, ExecutionException, TimeoutException  {
        InvokeAgentRequest request = InvokeAgentRequest.builder()
            .agentId("FM6LMISZO8")
            .agentAliasId("MYAMUNQOGK")
            .sessionId(UUID.randomUUID().toString())
            .inputText(userInput)
            .build();

        // Use the provided async method
        CompletableFuture<InvokeAgentResponse> future = new CompletableFuture<>();
        StringBuilder builder = new StringBuilder();
        asyncClient.invokeAgent(request, new InvokeAgentResponseHandler() {
            @Override
            public void responseReceived(InvokeAgentResponse response) {
                future.complete(response);
            }

            @Override
            public void exceptionOccurred(Throwable error) {
                future.completeExceptionally(error);
            }

			@Override
			public void complete() {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void onEventStream(SdkPublisher<ResponseStream> eventStream) {
				eventStream.subscribe(event -> {
		            if (event instanceof PayloadPart) {
		                PayloadPart part = (PayloadPart) event;
		                String chunk = part.bytes().asUtf8String();
		                builder.append(chunk);
		            }
		        });	
			}
        });
       	Thread.sleep(10000);// Wait for completion
        System.out.println("Agent response: " + builder.toString());
        return builder.toString();
    }
}