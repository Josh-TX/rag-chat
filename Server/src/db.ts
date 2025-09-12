import Database from 'better-sqlite3';

// Creates the database file if it doesn't exist
const db = new Database('sqlite.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS conversation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insertDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    updateDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    json TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS section (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    author TEXT NULL,
    content TEXT NOT NULL
  )
`);

export type SectionEntity = {
    id: number,
    name: string,
    source: string,
    author: string | null,
    content: string,
}


export type ConversationEntity = {
    id: number,
    insertDate: Date,
    updateDate: Date,
    name: string,
    json: string
}

export function createSection(section: {
    name: string,
    source: string,
    author: string | null,
    content: string,
}): number {
    var statement = db.prepare('INSERT INTO section (name, source, author, content) VALUES (?, ?, ?, ?)');
    var res = statement.run(section.name, section.source, section.author, section.content);
    return <number>res.lastInsertRowid
}

export function getSectionById(sectionId: number): SectionEntity {
    var statement = db.prepare('SELECT * FROM section WHERE id = ?');
    var res = statement.get(sectionId);
    return <any>res;
}

export function createConversation(name: string, json: string): number {
    var statement = db.prepare('INSERT INTO conversation (name, json) VALUES (?, ?)');
    var res = statement.run(name, json);
    return <number>res.lastInsertRowid
}

export function getConversationById(conversationId: number): ConversationEntity {
    var statement = db.prepare('SELECT * FROM conversation WHERE id = ?');
    var res = statement.get(conversationId);
    return <any>res;
}

export function getRecentConversations(conversationId: number): ConversationEntity[] {
    var statement = db.prepare('SELECT * FROM conversation ORDER BY insertDate LIMIT 100');
    var res = statement.all(conversationId);
    return <any[]>res;
}