# Payment Gateway Retry Runbook

## Overview

This runbook covers how to handle transient payment gateway failures (503, 429,
connection timeout) in the order processing service.

## Symptoms

- `HttpRequestException` with status 503 or 429 from the payment gateway endpoint.
- Spike in `payment_gateway_errors` metric.
- Orders stuck in `pending` state after checkout.

## Root Cause

The payment gateway applies rate limits during peak traffic.  Without a retry
policy, single transient failures surface as unhandled exceptions.

## Resolution

### Option 1 — Add Polly Retry Policy (Recommended)

```csharp
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .OrResult<HttpResponseMessage>(r => r.StatusCode == HttpStatusCode.ServiceUnavailable
                                     || r.StatusCode == HttpStatusCode.TooManyRequests)
    .WaitAndRetryAsync(
        retryCount: 3,
        sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
        onRetry: (outcome, timespan, attempt, _) =>
            logger.LogWarning("Gateway retry {Attempt} after {Delay}s", attempt, timespan.TotalSeconds));
```

Apply this policy to `PaymentGatewayClient.PostPaymentAsync`.

### Option 2 — Circuit Breaker

Add a Polly circuit breaker around the retry policy to open the circuit after
5 consecutive failures, preventing downstream cascade.

## Verification

After deploying the retry policy:
1. Check `payment_gateway_retry_count` metric rises without error spikes.
2. Confirm orders no longer appear in `pending` after transient 503s.
3. Run `make test-unit` to confirm unit tests pass.

## Escalation

If retries consistently exhaust all attempts, escalate to the payment gateway
vendor and check their status page.
