import {
  Client,
  Wallet,
  Invoke,
  SetHookFlags,
  TransactionMetadata,
} from "@transia/xrpl";
import {
  createHookPayload,
  setHooksV3,
  SetHookParams,
  Xrpld,
  ExecutionUtility,
} from "@transia/hooks-toolkit";
import "dotenv/config";

export async function main(): Promise<void> {
  const client = new Client(process.env.XRPLD_WSS);
  await client.connect();
  client.networkID = await client.getNetworkID();

  const aliceWallet = Wallet.fromSeed(process.env.ALICE_SEED);

  const hook = createHookPayload({
    version: 1,
    createFile: "base",
    namespace: "base",
    flags: SetHookFlags.hsfOverride,
    hookOnArray: ["Invoke"],
    fee: "100000",
  });

  await setHooksV3({
    client: client,
    seed: aliceWallet.seed,
    hooks: [{ Hook: hook }],
  } as SetHookParams);

  const builtTx: Invoke = {
    TransactionType: "Invoke",
    Account: aliceWallet.classicAddress,
  };
  const result = await Xrpld.submit(client, {
    wallet: aliceWallet,
    tx: builtTx,
  });

  const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
    client,
    result.meta as TransactionMetadata
  );
  console.log(hookExecutions.executions[0].HookReturnString);
  await client.disconnect();
}

main();
