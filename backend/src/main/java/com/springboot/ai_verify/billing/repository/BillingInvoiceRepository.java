package com.springboot.ai_verify.billing.repository;

import com.springboot.ai_verify.billing.model.BillingInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {

    List<BillingInvoice> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    Page<BillingInvoice> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);

    Optional<BillingInvoice> findByProviderInvoiceId(String providerInvoiceId);
}
