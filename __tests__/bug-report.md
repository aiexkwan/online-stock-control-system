# Bug Report - Stock Transfer Card

**Date**: 2025-08-11
**Component**: StockTransferCard
**Severity**: High

## Issue Description
Stock transfers are completing successfully in the database but showing "Invalid Transfer" error message to users.

## Steps to Reproduce
1. Login to system
2. Navigate to Operation > Stock Transfer
3. Select a destination (e.g., Fold Mill)
4. Enter valid operator number (e.g., 5997)
5. Enter pallet number and click search button

## Expected Behavior
- Transfer completes successfully
- Success message shown to user
- No error overlay

## Actual Behavior
- Transfer completes successfully in database ✓
- "Invalid Transfer" error overlay appears ✗
- User sees error despite successful operation ✗

## Evidence
- Database shows correct updates in `record_history` and `record_transfer` tables
- Transfer 110825/22 → Fold Mill succeeded but showed error
- Transfer 110825/21 → Production succeeded but showed error

## Impact
- User confusion - successful operations appear as failures
- Workflow disruption - error overlay blocks further operations
- False error reporting

## Root Cause Analysis
Likely issues:
1. Frontend validation logic incorrectly flagging valid transfers
2. Race condition between database update and UI response
3. Incorrect error handling in transfer response

## Affected Tables/Functions
- RPC Function: `rpc_transfer_pallet`
- Hook: `useStockTransfer`
- Action: `transferPallet` in stockTransferActions.ts
- Component: ErrorOverlay in StockTransferCard.tsx