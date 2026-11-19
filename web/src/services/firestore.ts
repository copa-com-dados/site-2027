import { collection, doc, getDoc, getDocs, orderBy, query, type QueryConstraint } from 'firebase/firestore';
import type { ZodType, ZodTypeDef } from 'zod';
import { db } from '../lib/firebase';

export class DataError extends Error {
  readonly kind: 'not-found' | 'invalid';
  constructor(message: string, kind: 'not-found' | 'invalid') {
    super(message);
    this.name = 'DataError';
    this.kind = kind;
  }
}

function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, path: string, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new DataError(`${path}: ${issue?.path.join('.') ?? ''} ${issue?.message ?? 'invalid'}`, 'invalid');
  }
  return result.data;
}

export async function fetchDoc<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  collectionName: string,
  id: string,
): Promise<T> {
  const path = `${collectionName}/${id}`;
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) throw new DataError(`${path} não encontrado`, 'not-found');
  return parse(schema, path, snap.data());
}

export async function fetchCollection<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<Array<T & { id: string }>> {
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return snap.docs.map((d) => ({ ...parse(schema, `${collectionName}/${d.id}`, d.data()), id: d.id }));
}

export { orderBy };
