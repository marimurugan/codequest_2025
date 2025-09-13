package com.ai.dispute_handle_service.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.ai.dispute_handle_service.helper.InMemoryRetriever;
import com.ai.dispute_handle_service.model.DisputeRequest;

@Configuration
public class Configurations {
		
	@Bean
	ChatMemory chatMemory() {
		MessageWindowChatMemory memory = MessageWindowChatMemory.builder().maxMessages(10).build();
		return memory;
	}

	@Bean
	public InMemoryRetriever inMemoryRetriever() {
		Map<String, DisputeRequest> knowledgeBase = new HashMap<>();
		knowledgeBase.put("FDR123",
				new DisputeRequest("REQ001", "FDR123", "INV001", "Open", LocalDate.of(2023, 10, 1),
						LocalDate.of(2023, 10, 15), LocalDate.of(2023, 10, 20), "John Doe", "ACC12345", "Refund",
						"Duplicate Transaction", LocalDate.of(2023, 9, 25), "PART001", "MERCHANT001",
						"123 Merchant St, City", new BigDecimal("100.00"), new BigDecimal("50.00")));
		knowledgeBase.put("FDR124",
				new DisputeRequest("REQ002", "FDR124", "INV002", "Closed", LocalDate.of(2023, 9, 20),
						LocalDate.of(2023, 10, 5), LocalDate.of(2023, 10, 10), "Jane Smith", "ACC67890", "Chargeback",
						"Unauthorized Transaction", LocalDate.of(2023, 9, 15), "PART002", "MERCHANT002",
						"456 Provider Ave, City", new BigDecimal("200.00"), new BigDecimal("200.00")));
		knowledgeBase.put("FDR125",
				new DisputeRequest("REQ003", "FDR125", "INV003", "Pending", LocalDate.of(2023, 10, 5),
						LocalDate.of(2023, 10, 20), LocalDate.of(2023, 10, 25), "Alice Johnson", "ACC54321", "Refund",
						"Product Not Received", LocalDate.of(2023, 9, 30), "PART003", "MERCHANT003",
						"789 Retail Rd, City", new BigDecimal("150.00"), new BigDecimal("0.00")));

		knowledgeBase.put("FDR126",
				new DisputeRequest("REQ004", "FDR126", "INV004", "Resolved", LocalDate.of(2023, 9, 10),
						LocalDate.of(2023, 9, 25), LocalDate.of(2023, 9, 30), "Bob Brown", "ACC98765", "Chargeback",
						"Fraudulent Transaction", LocalDate.of(2023, 9, 5), "PART004", "MERCHANT004",
						"321 Fraud Ln, City", new BigDecimal("300.00"), new BigDecimal("300.00")));

		knowledgeBase.put("FDR127",
				new DisputeRequest("REQ005", "FDR127", "INV005", "Open", LocalDate.of(2023, 10, 10),
						LocalDate.of(2023, 10, 25), LocalDate.of(2023, 10, 30), "Charlie Green", "ACC11223", "Refund",
						"Incorrect Billing", LocalDate.of(2023, 9, 28), "PART005", "MERCHANT005",
						"654 Billing Blvd, City", new BigDecimal("75.00"), new BigDecimal("25.00")));

		knowledgeBase.put("FDR128",
				new DisputeRequest("REQ006", "FDR128", "INV006", "Closed", LocalDate.of(2023, 8, 15),
						LocalDate.of(2023, 8, 30), LocalDate.of(2023, 9, 5), "Diana White", "ACC33445", "Chargeback",
						"Service Not Provided", LocalDate.of(2023, 8, 10), "PART006", "MERCHANT006",
						"987 Service St, City", new BigDecimal("500.00"), new BigDecimal("500.00")));

		knowledgeBase.put("FDR129",
				new DisputeRequest("REQ007", "FDR129", "INV007", "Pending", LocalDate.of(2023, 10, 12),
						LocalDate.of(2023, 10, 27), LocalDate.of(2023, 11, 1), "Eve Black", "ACC55667", "Refund",
						"Damaged Product", LocalDate.of(2023, 10, 1), "PART007", "MERCHANT007", "123 Damage Dr, City",
						new BigDecimal("250.00"), new BigDecimal("50.00")));
		return new InMemoryRetriever(knowledgeBase);
	}

}
