
package com.ai.dispute_handle_service.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DisputeRequest {

	private String requestId;
	private String fdrReferenceId;
	private String invoiceNumber;
	private String requestStatus;
	private LocalDate requestDate;
	private LocalDate dueDate;
	private LocalDate regZDueDate;
	private String primaryAccountholder;
	private String accountNumber;
	private String requestType;
	private String disputeReasons;
	private LocalDate transactionDate;
	private String partnerId;
	private String merchantId;
	private String providerAddress;
	private BigDecimal amount;
	private BigDecimal disputedAmount;

	public DisputeRequest(String requestId, String fdrReferenceId, String invoiceNumber, String requestStatus,
			LocalDate requestDate, LocalDate dueDate, LocalDate regZDueDate, String primaryAccountholder,
			String accountNumber, String requestType, String disputeReasons, LocalDate transactionDate,
			String partnerId, String merchantId, String providerAddress, BigDecimal amount, BigDecimal disputedAmount) {
		this.requestId = requestId;
		this.fdrReferenceId = fdrReferenceId;
		this.invoiceNumber = invoiceNumber;
		this.requestStatus = requestStatus;
		this.requestDate = requestDate;
		this.dueDate = dueDate;
		this.regZDueDate = regZDueDate;
		this.primaryAccountholder = primaryAccountholder;
		this.accountNumber = accountNumber;
		this.requestType = requestType;
		this.disputeReasons = disputeReasons;
		this.transactionDate = transactionDate;
		this.partnerId = partnerId;
		this.merchantId = merchantId;
		this.providerAddress = providerAddress;
		this.amount = amount;
		this.disputedAmount = disputedAmount;
	}

	// Getters and Setters
	public String getRequestId() {
		return requestId;
	}

	public void setRequestId(String requestId) {
		this.requestId = requestId;
	}

	public String getFdrReferenceId() {
		return fdrReferenceId;
	}

	public void setFdrReferenceId(String fdrReferenceId) {
		this.fdrReferenceId = fdrReferenceId;
	}

	public String getInvoiceNumber() {
		return invoiceNumber;
	}

	public void setInvoiceNumber(String invoiceNumber) {
		this.invoiceNumber = invoiceNumber;
	}

	public String getRequestStatus() {
		return requestStatus;
	}

	public void setRequestStatus(String requestStatus) {
		this.requestStatus = requestStatus;
	}

	public LocalDate getRequestDate() {
		return requestDate;
	}

	public void setRequestDate(LocalDate requestDate) {
		this.requestDate = requestDate;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	public void setDueDate(LocalDate dueDate) {
		this.dueDate = dueDate;
	}

	public LocalDate getRegZDueDate() {
		return regZDueDate;
	}

	public void setRegZDueDate(LocalDate regZDueDate) {
		this.regZDueDate = regZDueDate;
	}

	public String getPrimaryAccountholder() {
		return primaryAccountholder;
	}

	public void setPrimaryAccountholder(String primaryAccountholder) {
		this.primaryAccountholder = primaryAccountholder;
	}

	public String getAccountNumber() {
		return accountNumber;
	}

	public void setAccountNumber(String accountNumber) {
		this.accountNumber = accountNumber;
	}

	public String getRequestType() {
		return requestType;
	}

	public void setRequestType(String requestType) {
		this.requestType = requestType;
	}

	public String getDisputeReasons() {
		return disputeReasons;
	}

	public void setDisputeReasons(String disputeReasons) {
		this.disputeReasons = disputeReasons;
	}

	public LocalDate getTransactionDate() {
		return transactionDate;
	}

	public void setTransactionDate(LocalDate transactionDate) {
		this.transactionDate = transactionDate;
	}

	public String getPartnerId() {
		return partnerId;
	}

	public void setPartnerId(String partnerId) {
		this.partnerId = partnerId;
	}

	public String getMerchantId() {
		return merchantId;
	}

	public void setMerchantId(String merchantId) {
		this.merchantId = merchantId;
	}

	public String getProviderAddress() {
		return providerAddress;
	}

	public void setProviderAddress(String providerAddress) {
		this.providerAddress = providerAddress;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public BigDecimal getDisputedAmount() {
		return disputedAmount;
	}

	public void setDisputedAmount(BigDecimal disputedAmount) {
		this.disputedAmount = disputedAmount;
	}
}
