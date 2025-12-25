# Delegatecall Detection

## Overview

Delegatecall is a powerful EVM opcode that allows a contract to execute code from another contract in its own context. While useful for upgradeable contracts and libraries, it can be a significant security risk if not properly restricted.

## Why It Matters

**Security Implications:**
- Delegatecall preserves the calling contract's storage and msg.sender
- Can bypass access controls if unrestricted
- Used in major exploits (Parity wallet hack)
- Allows arbitrary code execution in contract's context

## Detection Method

The engine detects delegatecall by scanning bytecode for the DELEGATECALL opcode:
- **Opcode:** 0xF4
- **Detection:** Bytecode pattern matching
- **Risk Level:** HIGH if present

## Implementation

```typescript
private detectDelegatecall(bytecode: string): boolean {
    // DELEGATECALL opcode is 0xF4
    const code = bytecode.toLowerCase();
    return code.includes('f4');
}
```

## Risk Assessment

Contracts with delegatecall are automatically flagged with:
- **Permission:** `delegatecall` capability
- **Actor:** `admin` (assumed)
- **Admin Power:** HIGH
- **Revocable:** false (hardcoded in bytecode)

## Common Use Cases

**Legitimate:**
- Proxy contracts (UUPS, Transparent)
- Library calls (OpenZeppelin)
- Upgradeable patterns

**Risky:**
- Unrestricted delegatecall to user-supplied addresses
- No access control on delegatecall functions
- Delegatecall in non-proxy contracts

## Examples

**Safe:** OpenZeppelin UUPS Proxy
- Delegatecall to implementation contract
- Restricted by upgrade mechanism

**Unsafe:** Parity Wallet (2017)
- Unrestricted delegatecall
- Led to $150M+ loss

## Testing

Golden tests validate delegatecall detection:
- Contracts with delegatecall flagged as HIGH admin power
- Contracts without delegatecall unaffected
- Proxy contracts correctly identified
