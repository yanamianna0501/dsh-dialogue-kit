export function annotationQuote(quote, reply, source = '', labels = {original:'引用原文',comment:'我的批注'}) {
  if (!quote.trim() || !reply.trim()) throw new Error('INCOMPLETE_ANNOTATION');
  const normalize = text => text.replace(/\r\n?/g, '\n').trim();
  return `${labels.original}:\n${normalize(quote)}\n\n${labels.comment}:\n${normalize(reply)}${source ? '\n\n' + source : ''}`;
}

export function messageText(message) {
  return (message?.content ?? []).filter(x => x.type === 'text').map(x => x.text).join('\n');
}

// Read durable rows on demand; this is not a parallel conversation projection.
export function loadedMessages(entries) {
  const rows = [];
  let previousSeq;
  for (const entry of entries) {
    if (entry.type !== 'event') continue;
    const event = entry.event;
    if (event.type === 'user/message' || event.type === 'assistant/message') {
      const message = event.type === 'user/message' ? event.data : event.data?.message;
      const text = event.type === 'user/message' && message?.source?.kind !== 'user' ? '' : messageText(message);
      if (message?.id && text.trim()) rows.push({
        id: message.id, seq: event.seq, previousSeq,
        role: event.type === 'user/message' ? 'user' : 'assistant', text,
        hasAttachments: message.content.some(x => !['text', 'reasoning'].includes(x.type)),
      });
    }
    previousSeq = event.seq;
  }
  return rows;
}

export function parseDraft(raw) {
  const saved = JSON.parse(raw || '{}');
  return {
    notes: Array.isArray(saved?.notes) ? saved.notes.filter(x => x && typeof x.quote === 'string' && typeof x.reply === 'string' && typeof x.id === 'string') : [],
    restore: typeof saved?.restore === 'string' ? saved.restore : '',
  };
}

// A stale browser draft must never erase a newer draft from another window.
export function mergeDrafts(remote, local, newId) {
  const notes = [...remote.notes];
  for (const item of local.notes) {
    const existing = notes.find(x => x.id === item.id);
    if (!existing) notes.push(item);
    else if (existing.quote !== item.quote || existing.reply !== item.reply || existing.source !== item.source) notes.push({...item, id:newId()});
  }
  const restore = remote.restore && local.restore && remote.restore !== local.restore
    ? remote.restore + '\n\n' + local.restore : local.restore || remote.restore;
  return {notes,restore};
}

export function quoteBlock(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => '> ' + line).join('\n');
}

export function annotationMarkdown(items) {
  if (!items.length || items.some(item => !item.quote.trim() || !item.reply.trim())) throw new Error('INCOMPLETE_ANNOTATION');
  return items.map((item, index) => {
    const source = item.source ? `\n\n[${item.source}]` : '';
    return `### ${index + 1}\n\n${quoteBlock(item.quote)}\n\n${item.reply.trim()}${source}`;
  }).join('\n\n');
}

export function branchBoundary(row) {
  if (row.role !== 'user') throw new Error('USER_MESSAGE_REQUIRED');
  if (row.hasAttachments) throw new Error('ATTACHMENTS_NOT_COPIED');
  if (!Number.isInteger(row.previousSeq)) throw new Error('LOAD_OLDER_REQUIRED');
  return row.previousSeq;
}
