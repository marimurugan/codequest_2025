package com.ai.dispute_handle_service.conroller;

import com.ai.dispute_handle_service.service.BedrockChatService;
import com.ai.dispute_handle_service.model.DisputeRequest;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

	private final BedrockChatService bedrockChatService;

	public ChatController(BedrockChatService bedrockChatService) {
		this.bedrockChatService = bedrockChatService;
	}

	@PostMapping
	public String chat(@RequestBody String prompt) {
		return bedrockChatService.askBedrock(prompt);
	}

	@GetMapping("/dispute-requests")
	public List<DisputeRequest> getAllDisputeRequests() {
		return bedrockChatService.getAllDisputeRequests();
	}

	@GetMapping("/dispute-requests/{referenceId}")
	public DisputeRequest getDisputeRequestByReferenceId(@PathVariable String referenceId) {
		return bedrockChatService.getDisputeRequestByReferenceId(referenceId);
	}
}
