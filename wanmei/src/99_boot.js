boot();
if (DBG) Object.assign(DBG, { W, PARTY, STORY, QUESTS, jump(qi) { startStory(qi, 0); }, ents: () => W.ents.map(e => [e.tag || e.kind || e.type, Math.round(e.x), Math.round(e.z), e.alive]) });
