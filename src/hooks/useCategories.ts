import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type { CustomCategory } from "../types";

export function useCategories(firebaseUser: User | null) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      setCustomCategories([]);
      return;
    }

    const categoriesRef = collection(db, "users", firebaseUser.uid, "categories");
    const categoriesQuery = query(categoriesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const firestoreCategories: CustomCategory[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();

            return {
              id: docSnapshot.id,
              name: data.name as string,
            };
          })
          .filter((category) => Boolean(category.name));

        setCustomCategories(firestoreCategories);
      },
      (error) => {
        console.error("Firestore categories listener failed:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  async function addCategory(name: string, categories: string[]) {
    if (!firebaseUser) return null;

    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const categoryAlreadyExists = categories.some(
      (category) => category.toLowerCase() === trimmedName.toLowerCase()
    );

    if (categoryAlreadyExists) return null;

    const categoriesRef = collection(db, "users", firebaseUser.uid, "categories");

    await addDoc(categoriesRef, {
      name: trimmedName,
      createdAt: serverTimestamp(),
    });

    return trimmedName;
  }

  async function deleteCategory(category: CustomCategory) {
    if (!firebaseUser) return;

    const categoryRef = doc(
      db,
      "users",
      firebaseUser.uid,
      "categories",
      category.id
    );

    await deleteDoc(categoryRef);
  }

  return {
    customCategories,
    addCategory,
    deleteCategory,
  };
}