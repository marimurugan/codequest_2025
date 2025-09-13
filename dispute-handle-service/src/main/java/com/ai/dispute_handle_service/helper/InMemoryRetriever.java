package com.ai.dispute_handle_service.helper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ai.dispute_handle_service.model.DisputeRequest;

public class InMemoryRetriever {
	
	private final Map<String, DisputeRequest> knowledgeBase;

	public InMemoryRetriever(Map<String, DisputeRequest> knowledgeBase) {
		this.knowledgeBase = knowledgeBase;
	}

	public List<DisputeRequest> retrieve(String query) {
		return knowledgeBase.entrySet().stream().filter(entry -> entry.getKey().contains(query))
				.map(Map.Entry::getValue).collect(Collectors.toList());
	}
	
	public Map<String, DisputeRequest> getKnowledgeBase() {
	    return knowledgeBase;
	}

}
