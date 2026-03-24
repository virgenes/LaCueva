const MAX_MESSAGES = 50;
const store = [];
export function addMessage(msg) {
    store.push(msg);
    if (store.length > MAX_MESSAGES) {
        store.shift();
    }
}
export function getMessages(limit = MAX_MESSAGES) {
    const count = Math.min(limit, MAX_MESSAGES);
    return store.slice(-count);
}
//# sourceMappingURL=messageStore.js.map