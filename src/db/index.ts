import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleBun } from 'drizzle-orm/bun-sql';
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { SQL } from "bun";

const isDev = process.env.NODE_ENV === 'development';

export const db = isDev
    ? drizzleNeon({ client: neon(process.env.DATABASE_URL!), schema })
    : drizzleBun({ client: new SQL(process.env.DATABASE_URL!), schema })

export type Database = typeof db;
