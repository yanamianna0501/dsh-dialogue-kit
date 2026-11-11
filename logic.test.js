import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annotationQuote, messageText, loadedMessages, quoteBlock, annotationMarkdown, branchBoundary, parseDraft, mergeDrafts } from './logic.js';

test('inline annotation card separates original from comment and retains source',()=>{
  assert.equal(annotationQuote(' 原文\r\n第二行 ', ' 回复 ', 'msg-1'),'引用原文:\n原文\n第二行\n\n我的批注:\n回复\n\nmsg-1');
});
test('inline annotation card supports localized labels and rejects empty input',()=>{
  assert.equal(annotationQuote('x','y','',{original:'Original',comment:'Comment'}),'Original:\nx\n\nComment:\ny');
  assert.throws(()=>annotationQuote('x',' '),/INCOMPLETE_ANNOTATION/);
  assert.throws(()=>annotationQuote(' ','y'),/INCOMPLETE_ANNOTATION/);
});

test('text extraction excludes reasoning and preserves unicode', () => {
  assert.equal(messageText({content:[{type:'reasoning',text:'hidden'},{type:'text',text:'中文😀'},{type:'image'},{type:'text',text:'two'}]}),'中文😀\ntwo');
});
test('loaded rows use exact previous durable boundary, not seq minus one', () => {
  const events=[{type:'event',event:{seq:3,type:'turn/start'}},{type:'transient',event:{seq:8,type:'assistant/live-chunk'}},{type:'event',event:{seq:9,type:'user/message',data:{id:'u',source:{kind:'user'},content:[{type:'text',text:'hello'}]}}}];
  const [row]=loadedMessages(events);assert.equal(row.previousSeq,3);assert.equal(branchBoundary(row),3);
});
test('refuses missing prefix, non-user and attachment branch boundaries',()=>{
  assert.throws(()=>branchBoundary({role:'user',hasAttachments:false}),/LOAD_OLDER_REQUIRED/);
  assert.throws(()=>branchBoundary({role:'assistant',previousSeq:1}),/USER_MESSAGE_REQUIRED/);
  assert.throws(()=>branchBoundary({role:'user',hasAttachments:true,previousSeq:1}),/ATTACHMENTS_NOT_COPIED/);
});
test('quote normalizes line endings, blank lines, nested markdown',()=>{
  assert.equal(quoteBlock('一\r\n\r\n> 二'),'\u003e 一\n\u003e \n\u003e > 二');
});
test('annotations pair excerpts and replies with source identity',()=>{
  assert.equal(annotationMarkdown([{quote:'a\nb',reply:' 答复 ',source:'msg-1'}]),'### 1\n\n> a\n> b\n\n答复\n\n[msg-1]');
  assert.throws(()=>annotationMarkdown([{quote:'x',reply:' '}]),/INCOMPLETE_ANNOTATION/);
  assert.throws(()=>annotationMarkdown([]),/INCOMPLETE_ANNOTATION/);
});
test('restores more than 100 annotations without truncating accepted data',()=>{
  const notes=Array.from({length:101},(_,i)=>({id:String(i),quote:'原文',reply:'回复'}));
  assert.equal(parseDraft(JSON.stringify({notes})).notes.length,101);
});
test('stale-window merge preserves remote and local conflicting notes and restored text',()=>{
  const remote={notes:[{id:'same',quote:'a',reply:'remote'},{id:'remote',quote:'b',reply:'b'}],restore:'remote'};
  const local={notes:[{id:'same',quote:'a',reply:'local'},{id:'local',quote:'c',reply:'c'}],restore:'local'};
  const merged=mergeDrafts(remote,local,()=> 'conflict');
  assert.equal(merged.notes.length,4);assert.equal(merged.notes.find(x=>x.id==='conflict').reply,'local');
  assert.equal(merged.restore,'remote\n\nlocal');
  assert.equal(mergeDrafts(remote,remote,()=> 'unused').notes.length,2);
});
test('non-text and missing messages do not yield operations',()=>{
  assert.deepEqual(loadedMessages([{type:'event',event:{seq:1,type:'tool/result',data:{}}},{type:'event',event:{seq:2,type:'assistant/message',data:{message:{id:'a',content:[{type:'reasoning',text:'not for quote'}]}}}}]),[]);
});
