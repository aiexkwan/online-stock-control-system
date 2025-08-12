# Test target : [QCLabelCard](../../app/(app)/admin/cards/QCLabelCard.tsx)

## Tarfer
- Using Playwright MCP to run to fullfill test purpose

## Revoke agents
- [Backend-Arc](../../.claude/agents/backend-architect.md)
- [Business-Anly](../../.claude/agents/business-analyst.md)
- [Test-automator](../../.claude/agents/test-automator.md)

## Preparation
- Read thought codebase and realted to have a fully understand of target components working logic
    - knowing what RPC function is using
    - knowing what table will be update within Supabase
    - knowing what show be showing in UI for user
    - etc

## Reminder before running test
- Your purpose is write test and run til success.
- Dont excute any debug or code editing action unless confirmed by user
- All test relate file/doc must save into [Testfolder](/Users/chun/Documents/PennineWMS/online-stock-control-system/__tests__)
- Only need to test Chrome browser, no need for other browsers type
- Only run test within same browser, simuilate single worker operating continously.

## Testflow
1. Login system thought [Main Login Page](app/(auth)/main-login/page.tsx)
    - Login email: `${env.local.TEST_SYS_LOGIN}`
    - Login password: `${env.local.TEST_SYS_LOGIN}`
    - *NEVER hard-coding .env detail into test code*

2. Choose target cards thought navigation cards
    - [Cards-Selector](../../app/(app)/admin/cards/AnalysisCardSelector.tsx)
    - [Tab-Selector](../../app/(app)/admin/cards/TabSelectorCard.tsx)

3. Run 4 times of test
- 1st time
    - `Product Code` field : `MEP9090150`
    - `Quantity` field : `20`
    - `Pallet Count` field : `1`
    - `Operator` field : [Empty]
    - Press `Print Label` button
    - `Verified Clock ID` field : `5997`
    - Press cancel if any `print window` popup

- 2nd time
    - `Product Code` field : `ME4545150`
    - `Quantity` field : `20`
    - `Pallet Count` field : `2`
    - `Operator` field : [Empty]
    - Press `Print Label` button
    - `Verified Clock ID` field : `6001`
    - Press cancel if any `print window` popup

- 3rd time
    - `Product Code` field : `MEL4545A`
    - `Quantity` field : `20`
    - `Pallet Count` field : `3`
    - `Operator` field : [Empty]
    - Press `Print Label` button
    - `Verified Clock ID` field : `5667`
    - Press cancel if any `print window` popup

- 4th time
    - `Product Code` field : `MEL6060A`
    - `Quantity` field : `20`
    - `Pallet Count` field : `2`
    - `Operator` field : [Empty]
    - Press `Print Label` button
    - `Verified Clock ID` field : `5997`
    - Press cancel if any `print window` popup

4. Recult verify
    - check if all related table updated successful
        - `record_history`
        - `record_inventory`
        - `stock_level`
        - `record_palletinfo`
        - `work_level`
        - `pallet_number_buffer`
        - etc