import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    query
} from "firebase/firestore";
import { db } from "./firebase";

export interface CustomGameImage {
    gameCode: string; // pay_to_company
    imageUrl: string;
}

const COLLECTION_NAME = "game_images";

/** ดึงข้อมูลรูปภาพเกมทั้งหมดที่ Admin กำหนดเอง */
export async function getAllCustomGameImages(): Promise<Record<string, string>> {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const images: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
            images[doc.id] = doc.data().imageUrl;
        });
        return images;
    } catch (error) {
        console.error("Error getting custom game images:", error);
        return {};
    }
}

/** บันทึกรูปภาพเกม */
export async function saveCustomGameImage(gameCode: string, imageUrl: string): Promise<void> {
    try {
        await setDoc(doc(db, COLLECTION_NAME, gameCode), {
            imageUrl,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error saving custom game image:", error);
        throw error;
    }
}

/** ลบรูปภาพเกม */
export async function deleteCustomGameImage(gameCode: string): Promise<void> {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, gameCode));
    } catch (error) {
        console.error("Error deleting custom game image:", error);
        throw error;
    }
}
