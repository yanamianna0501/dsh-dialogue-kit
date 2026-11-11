window.__ModuleLoader__.load({
  id:'@local/dsh-dialogue-kit',
  factory(require) {
    const React=require('react');
    const {useState,useEffect}=React;
    const h=React.createElement;
    function annotationQuote(quote, reply, source = '', labels = {original:'引用原文',comment:'我的批注'}) {
  if (!quote.trim() || !reply.trim()) throw new Error('INCOMPLETE_ANNOTATION');
  const normalize = text => text.replace(/\r\n?/g, '\n').trim();
  return `${labels.original}:\n${normalize(quote)}\n\n${labels.comment}:\n${normalize(reply)}${source ? '\n\n' + source : ''}`;
}

function messageText(message) {
  return (message?.content ?? []).filter(x => x.type === 'text').map(x => x.text).join('\n');
}

// Read durable rows on demand; this is not a parallel conversation projection.
function loadedMessages(entries) {
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

function parseDraft(raw) {
  const saved = JSON.parse(raw || '{}');
  return {
    notes: Array.isArray(saved?.notes) ? saved.notes.filter(x => x && typeof x.quote === 'string' && typeof x.reply === 'string' && typeof x.id === 'string') : [],
    restore: typeof saved?.restore === 'string' ? saved.restore : '',
  };
}

// A stale browser draft must never erase a newer draft from another window.
function mergeDrafts(remote, local, newId) {
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

function quoteBlock(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => '> ' + line).join('\n');
}

function annotationMarkdown(items) {
  if (!items.length || items.some(item => !item.quote.trim() || !item.reply.trim())) throw new Error('INCOMPLETE_ANNOTATION');
  return items.map((item, index) => {
    const source = item.source ? `\n\n[${item.source}]` : '';
    return `### ${index + 1}\n\n${quoteBlock(item.quote)}\n\n${item.reply.trim()}${source}`;
  }).join('\n\n');
}

function branchBoundary(row) {
  if (row.role !== 'user') throw new Error('USER_MESSAGE_REQUIRED');
  if (row.hasAttachments) throw new Error('ATTACHMENTS_NOT_COPIED');
  if (!Number.isInteger(row.previousSeq)) throw new Error('LOAD_OLDER_REQUIRED');
  return row.previousSeq;
}

    const NS='localDialogueKit';
    const zh={quote:'引用',annotate:'批注回复',join:'加入本会话',comment:'添加评论…',save:'保存批注',cancel:'取消',
      original:'引用原文',myComment:'我的批注',source:'来源消息',blocked:'当前草稿暂时不可编辑，评论仍保留。请等待发送完成或退出命令后重试。',
      noText:'原文选区已失效，请重新选择。',
      legacy:'恢复旧版未发送批注',legacyFailed:'旧批注未能全部恢复；原数据仍保留。'};
    const en={quote:'Quote',annotate:'Annotate / reply',join:'Add to conversation',comment:'Add a comment…',save:'Save annotation',cancel:'Cancel',
      original:'Original excerpt',myComment:'My comment',source:'Source message',blocked:'Draft is unavailable. Your comment is retained; finish sending or exit command mode and retry.',
      noText:'The selection is no longer available. Select the text again.',
      legacy:'Recover unsent legacy annotations',legacyFailed:'Some annotations could not be restored; the original data is retained.'};
    const css=`
.dk-inline{display:inline-flex;position:relative;align-items:center;gap:4px;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;max-width:100%}
.dk-inline button{font:inherit;cursor:pointer;color:var(--dsw-alias-label-secondary);border:0;background:transparent;padding:6px 8px;border-radius:6px;white-space:nowrap}
.dk-inline button:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.dk-inline button:disabled{opacity:.45;cursor:default}.dk-inline button:focus-visible,.dk-comment textarea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dk-selection{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:2px}
.dk-comment{display:block;box-sizing:border-box;width:min(360px,78vw);max-width:100%;padding:8px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}
.dk-comment.dk-floating{position:absolute;bottom:calc(100% + 8px);right:0;z-index:3;max-width:78vw}
.dk-comment blockquote{margin:0 0 6px;padding:0 0 0 8px;border-left:2px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.dk-comment textarea{box-sizing:border-box;width:100%;min-height:52px;max-height:160px;resize:vertical;display:block;border:0;border-radius:4px;padding:4px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font:inherit;line-height:1.5}
.dk-comment-actions{display:flex;justify-content:flex-end;gap:4px;margin-top:4px}.dk-inline .dk-save{color:var(--dsw-alias-brand-primary)}
.dk-inline .dk-error{display:block;color:var(--dsw-alias-state-error-primary);font-size:12px;white-space:normal;overflow-wrap:anywhere}
`;
    return {
      inject:['slots','locale'],
      apply(ctx) {
        ctx.effect(()=>ctx.locale.register(NS,{zh,en}));
        const styleId='dsh-dialogue-kit:style';
        const ensureStyle=()=>{
          if(typeof document==='undefined')return;
          let tag=document.getElementById(styleId);
          if(!tag){
            tag=document.createElement('style');
            tag.id=styleId;tag.dataset.plugin='@local/dsh-dialogue-kit';
            document.head.appendChild(tag);
          }
          if(tag.textContent!==css)tag.textContent=css;
        };
        ensureStyle();
        // 清除任何历史版本残留的全局浮层
        for(const stale of document.querySelectorAll('.dk-float'))stale.remove();
        const tFor=()=>ctx.locale.bind(NS);
        const button=(text,onClick,props={})=>h('button',{type:'button',onClick,title:text,...props},text);
        const writable=s=>!s.removed&&(s.subagent===null||s.subagent.address.mode==='continuable'&&s.subagent.parentAvailable===true);
        function CommentForm({text,source='',inputActions,onDone,onCancel,floating=false}) {
          const t=tFor();const [reply,setReply]=useState('');const [error,setError]=useState('');
          function save(event) {
            event.preventDefault();if(!reply.trim())return;
            const content=annotationQuote(text,reply,source,{original:t('original'),comment:t('myComment')});
            if(!inputActions.insertQuote(content)){setError(t('blocked'));return;}
            onDone();
          }
          return h('form',{className:'dk-comment'+(floating?' dk-floating':''),onSubmit:save,onKeyDown:e=>{
            if(e.key==='Escape'){e.stopPropagation();onCancel();}
          }},
            h('blockquote',{title:text},text),
            h('textarea',{'aria-label':t('comment'),placeholder:t('comment'),value:reply,onChange:e=>setReply(e.target.value),autoFocus:true,rows:2}),
            h('div',{className:'dk-comment-actions'},button(t('cancel'),onCancel),h('button',{type:'submit',className:'dk-save',title:t('save'),'aria-label':t('save'),disabled:!reply.trim()},'✓')),
            error&&h('span',{className:'dk-error',role:'alert'},error));
        }
        function SelectionActions(props) {
          const {readText,dismiss,clearSelection,inputActions}=props;
          const t=tFor();const [text,setText]=useState(null);const [error,setError]=useState('');
          const enabled=props.useSession(writable);
          useEffect(()=>{if(!enabled)dismiss();},[enabled,dismiss]);
          if(!enabled)return null;
          const done=()=>{clearSelection();dismiss();};
          function begin() {
            const selected=readText();if(!selected?.trim()){setError(t('noText'));return;}
            setText(selected);setError('');
          }
          function quote() {
            const selected=readText();if(!selected?.trim()){setError(t('noText'));return;}
            if(!inputActions.insertQuote(selected)){setError(t('blocked'));return;}done();
          }
          return h('div',{className:'dk-inline dk-selection'},text===null?
            h(React.Fragment,null,button(t('quote'),quote,{onPointerDown:e=>e.preventDefault()}),button(t('join'),begin,{onPointerDown:e=>e.preventDefault()})):
            h(CommentForm,{text,inputActions,onDone:done,onCancel:()=>{setText(null);dismiss();}}),
            error&&h('span',{className:'dk-error',role:'alert'},error));
        }
        function AssistantActions(props) {
          const t=tFor();const [editing,setEditing]=useState(false);const [error,setError]=useState('');
          const enabled=props.useSession(writable);
          const text=props.useChat(s=>{for(const node of s.nodes.values())if(node.kind==='assistant-step'&&node.data.finalNode?.messageId===props.messageId)return node.data.blocks.filter(b=>b.kind==='text').map(b=>b.text).join('');return '';});
          const ready=props.useInput(s=>s.phase==='plain');
          useEffect(()=>{if(!enabled)setEditing(false);},[enabled]);
          return h('span',{className:'dk-inline'},
            button(t('quote'),()=>{if(!props.inputActions.insertQuote(text))setError(t('blocked'));else setError('');},{disabled:!enabled||!ready||!text}),
            button(t('annotate'),()=>{setEditing(!editing);setError('');},{disabled:!enabled||!text,'aria-expanded':editing}),
            editing&&h(CommentForm,{text,source:`${t('source')}: ${props.messageId}`,inputActions:props.inputActions,floating:true,onDone:()=>setEditing(false),onCancel:()=>setEditing(false)}),
            error&&h('span',{className:'dk-error',role:'alert'},error));
        }
        // Compatibility only: do not delete v1 unsent notes while removing its UI.
        function LegacyRecovery(props) {
          const t=tFor();const [pending,setPending]=useState(()=>{
            try{return parseDraft(localStorage.getItem('dsh-dialogue-kit:draft:v1:'+props.sessionId));}catch{return null;}
          });const [error,setError]=useState('');
          if(!pending||!pending.notes.length&&!pending.restore)return null;
          function recover() {
            const content=pending.notes.map(item=>item.reply.trim()?annotationQuote(item.quote,item.reply,item.source):item.quote).join('\n\n')+(pending.restore?'\n\n'+pending.restore:'');
            if(!props.inputActions.insertQuote(content)){setError(t('legacyFailed'));return;}
            setPending(null);
          }
          return h('span',{className:'dk-inline'},button(t('legacy'),recover),error&&h('span',{role:'alert',className:'dk-error'},error));
        }
        const register=(name,options,component)=>ctx.slots.inject(name,()=>ctx.slots.register({name,locale:NS,...options},component));
        register('conversation.chat.text-interaction',{key:'quote',priority:-100},SelectionActions);
        register('conversation.chat.assistant-actions',{id:'local-dialogue-kit',order:30},AssistantActions);
        register('conversation.input.left',{id:'local-dialogue-legacy',order:40},LegacyRecovery);
      }
    };
  }
});
