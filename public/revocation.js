export const REVOCABLE_KINDS=Object.freeze(['pix','pay','receive','auction_sale','auction_unsold','bankrupt','end']);
export function canRevoke(t){return !!t&&!t.revoked&&REVOCABLE_KINDS.includes(t.kind)&&typeof t.id==='string'&&typeof t.actor==='string'}
