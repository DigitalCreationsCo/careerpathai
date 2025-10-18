
import { RunnableConfig } from "./configuration";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Checkpoint } from "@langchain/langgraph-checkpoint";

/**
 * CheckpointerManager manages Postgres-backed LangGraph state persistence.
 */
export class CheckpointerManager {
  private checkpointer: PostgresSaver | null = null;
  private isInitialized = false;

  /** Get or create Drizzle DB instance for checkpointing */
  async getCheckpointer() {
    if (!this.isInitialized) {
      await this.initializeCheckpointer();
    }
    return this.checkpointer;
  }

  /** Initialize Drizzle with a Postgres pool */
  private async initializeCheckpointer() {
    let databaseUrl = process.env.POSTGRES_URL;
    if (!databaseUrl) {
      throw new Error("POSTGRES_URL environment variable is required");
    }

    const checkpointer = PostgresSaver.fromConnString(databaseUrl);
    await checkpointer.setup();

    this.checkpointer = checkpointer;
    this.isInitialized = true;
  }

  /** Save checkpoint to database */
//   async saveCheckpoint(threadId: string, state: Record<string, any>) {
  async saveCheckpoint(config: RunnableConfig, checkPoint: Checkpoint) {
    if (!this.checkpointer) throw new Error("Checkpointer not initialized");

    await this.checkpointer.put(config, checkPoint, {} as any, {})
    //   .insertInto("checkpoints")
    //   .values({
    //     id: threadId,
    //     state: JSON.stringify(state),
    //     updatedAt: new Date(),
    //     createdAt: new Date(),
    //   })
    //   .onConflict((oc) => oc.column("id").doUpdateSet({ state: JSON.stringify(state), updatedAt: new Date() }))
    //   .execute();
  }

  /** Load checkpoint state from database */
//   async loadCheckpoint(threadId: string): Promise<CheckpointRecord | null> {
  async loadCheckpoint(config: RunnableConfig): Promise<Checkpoint | undefined> {
    if (!this.checkpointer) throw new Error("Checkpointer not initialized");

    const checkpoint = await this.checkpointer.get(config);

    // const result = await this.db
    //   .selectFrom("checkpoints")
    //   .selectAll()
    //   .where("id", "=", threadId)
    //   .executeTakeFirst();

    // if (!result) return null;

    // return {
    //   id: result.id,
    //   state: JSON.parse(result.state),
    //   createdAt: result.createdAt,
    //   updatedAt: result.updatedAt,
    // };
    return checkpoint;
  }

  async listCheckpoints(config: RunnableConfig) {
    if (!this.checkpointer) throw new Error("Checkpointer not initialized");

    for await (const checkpoint of this.checkpointer.list(config)) {
        console.log(checkpoint);
    }
  }
}

export const checkpointerManager = new CheckpointerManager();
