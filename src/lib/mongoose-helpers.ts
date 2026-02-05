/**
 * Mongoose Helper Utilities
 * 
 * ALWAYS use these patterns:
 * - For READ without modification: use .lean() -> plain object (no .toObject() needed)
 * - For READ with modification: use .exec() -> call .toObject()
 * - For UPDATE: use .findOne() + .exec() -> modify -> .save() (NOT findOneAndUpdate)
 * - For DELETE: use .findOneAndDelete() or use lean()
 */

/**
 * Convert Mongoose document to plain object safely
 * Works with both Mongoose documents and plain objects
 */
export function toPlainObject<T>(data: any): T {
  if (!data) return data;
  
  // If it's already a plain object (from .lean()), return as-is
  if (!data.toObject) {
    return data as T;
  }
  
  // If it's a Mongoose document, convert to plain object
  return data.toObject() as T;
}

/**
 * Convert array of Mongoose documents to plain objects
 */
export function toPlainObjectArray<T>(data: any[]): T[] {
  if (!Array.isArray(data)) return [];
  return data.map(item => toPlainObject<T>(item));
}

/**
 * Serialize Mongoose document to JSON-safe object
 * Removes circular references and converts all documents
 */
export function serializeDocument<T>(doc: any): T {
  if (!doc) return doc;
  
  // For Mongoose documents, use toObject
  if (typeof doc.toObject === 'function') {
    return doc.toObject() as T;
  }
  
  // For plain objects, return directly
  return doc as T;
}

/**
 * Safe JSON stringify for API responses
 */
export function jsonSerialize<T>(data: T): string {
  return JSON.stringify(
    serializeDocument(data),
    (key, value) => {
      // Handle ObjectId
      if (value && typeof value === 'object' && value.constructor?.name === 'ObjectId') {
        return value.toString();
      }
      // Handle Date
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }
  );
}
