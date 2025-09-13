package com.ai.dispute_handle_service.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;
import com.ai.dispute_handle_service.helper.InMemoryRetriever;
import com.ai.dispute_handle_service.model.DisputeRequest;

@Service
public class BedrockChatService {

	private final ChatClient chatClient;
	private final InMemoryRetriever retriever;

	public BedrockChatService(ChatClient.Builder chatClientBuilder, ChatMemory chatMemory,
			InMemoryRetriever retriever) {
		SimpleLoggerAdvisor customLogger = new SimpleLoggerAdvisor(
				request -> "Custom request: " + request.prompt().getUserMessage(),
				response -> "Custom response: " + response.getResult(), 0);
		this.chatClient = chatClientBuilder
				.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build(),customLogger).build();
		this.retriever = retriever;
	}

	public String askBedrock(String prompt) {
		String conversationId = "007";
		List<DisputeRequest> context = retriever.retrieve(prompt); // String
		return chatClient.prompt().user(prompt).advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId)).call().content();
	}

//	public BedrockChatService(InMemoryRetriever retriever) {
//		this.retriever = retriever;
//	}

	public List<DisputeRequest> getAllDisputeRequests() {
		return new ArrayList<>(retriever.getKnowledgeBase().values());
	}

	public DisputeRequest getDisputeRequestByReferenceId(String referenceId) {
		return retriever.getKnowledgeBase().get(referenceId);
	}
}
