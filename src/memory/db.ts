import admin from 'firebase-admin';
import Database from 'better-sqlite3';
import { ENV } from '../config/env.js';
import fs from 'fs';
import path from 'path';

let firestore: FirebaseFirestore.Firestore | null = null;
let sqlite: Database.Database | null = null;

// Helper to check if Firebase is configured
const hasFirebase = ENV.GOOGLE_APPLICATION_CREDENTIALS && 
                    fs.existsSync(path.resolve(ENV.GOOGLE_APPLICATION_CREDENTIALS));

if (hasFirebase) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(path.resolve(ENV.GOOGLE_APPLICATION_CREDENTIALS!))
        });
        firestore = admin.firestore();
        console.log("☁️ Cloud Memory initialized (Firebase Firestore)");
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
    }
} else {
    const dir = path.dirname(ENV.DB_PATH);
    if (dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sqlite = new Database(ENV.DB_PATH);
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("🏠 Local Memory initialized (SQLite)");
}

export async function addMessage(userId: string, role: string, content: string) {
    if (firestore) {
        await firestore.collection('chats').doc(userId).collection('messages').add({
            role,
            content,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } else if (sqlite) {
        const stmt = sqlite.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)');
        stmt.run(userId, role, content);
    }
}

export async function getMessages(userId: string, limit: number = 20) {
    if (firestore) {
        const snapshot = await firestore.collection('chats')
            .doc(userId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limitToLast(limit)
            .get();
        return snapshot.docs.map(doc => doc.data() as { role: 'user' | 'assistant' | 'system', content: string });
    } else if (sqlite) {
        const stmt = sqlite.prepare(`
            SELECT role, content 
            FROM (
                SELECT role, content, timestamp 
                FROM messages 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ) 
            ORDER BY timestamp ASC
        `);
        return stmt.all(userId, limit) as { role: 'user' | 'assistant' | 'system', content: string }[];
    }
    return [];
}

export async function clearMessages(userId: string) {
    if (firestore) {
        const snapshot = await firestore.collection('chats').doc(userId).collection('messages').get();
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } else if (sqlite) {
        const stmt = sqlite.prepare('DELETE FROM messages WHERE user_id = ?');
        stmt.run(userId);
    }
}
