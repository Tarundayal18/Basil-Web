import { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";

interface Category {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export function useCategoryManagement(storeId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);

  // Load categories when store is available
  useEffect(() => {
    const loadCategories = async () => {
      if (storeId) {
        try {
          const cats = await inventoryService.getCategories(storeId);
          setCategories(cats);
        } catch (error) {
          console.error("Failed to load categories:", error);
        }
      }
    };
    loadCategories();
  }, [storeId]);

  // Load subcategories when category is selected
  const loadSubcategories = async (categoryId: string) => {
    if (categoryId) {
      try {
        const subs = await inventoryService.getSubcategories(categoryId);
        setSubcategories(subs);
      } catch (error) {
        console.error("Failed to load subcategories:", error);
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleCreateCategory = async (
    onSuccess?: (categoryId: string) => void
  ) => {
    if (!newCategoryName.trim() || !storeId) return;
    setCreatingCategory(true);
    try {
      const newCategory = await inventoryService.createCategory({
        name: newCategoryName.trim(),
        storeId,
      });
      setCategories([...categories, newCategory]);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      if (onSuccess) {
        onSuccess(newCategory.id);
      }
      return newCategory.id;
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubcategory = async (
    categoryId: string,
    onSuccess?: (subcategoryId: string) => void
  ) => {
    if (!newSubcategoryName.trim() || !categoryId) return;
    setCreatingSubcategory(true);
    try {
      const newSubcategory = await inventoryService.createSubcategory({
        name: newSubcategoryName.trim(),
        categoryId,
      });
      setSubcategories([...subcategories, newSubcategory]);
      setShowNewSubcategoryInput(false);
      setNewSubcategoryName("");
      if (onSuccess) {
        onSuccess(newSubcategory.id);
      }
      return newSubcategory.id;
    } catch (error) {
      console.error("Failed to create subcategory:", error);
      throw error;
    } finally {
      setCreatingSubcategory(false);
    }
  };

  return {
    categories,
    setCategories,
    subcategories,
    setSubcategories,
    showNewCategoryInput,
    setShowNewCategoryInput,
    newCategoryName,
    setNewCategoryName,
    showNewSubcategoryInput,
    setShowNewSubcategoryInput,
    newSubcategoryName,
    setNewSubcategoryName,
    creatingCategory,
    creatingSubcategory,
    loadSubcategories,
    handleCreateCategory,
    handleCreateSubcategory,
  };
}
