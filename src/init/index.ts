import {
  Client,
  Wallet,
  Payment,
  SetHookFlags,
  TransactionMetadata,
  xrpToDrops,
} from "@transia/xrpl";
import {
  createHookPayload,
  setHooksV3,
  SetHookParams,
  Xrpld,
  ExecutionUtility,
} from "@transia/hooks-toolkit";

export async function main(): Promise<void> {
  const serverUrl = "wss:jshooks.xahau-test.net";
  const client = new Client(serverUrl);
  await client.connect();
  client.networkID = await client.getNetworkID();

  const aliceWallet = Wallet.fromSeed("ssbTMHrmEJP7QEQjWJH3a72LQipBM");
  const bobWallet = Wallet.fromSeed("spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1");

  const hook = createHookPayload({
    version: 1,
    createFile: "base",
    namespace: "base",
    flags: SetHookFlags.hsfOverride,
    hookOnArray: ["Invoke", "Payment"],
    fee: "100000",
  });

  await setHooksV3({
    client: client,
    seed: aliceWallet.seed,
    hooks: [{ Hook: hook }],
  } as SetHookParams);

  // PAYMENT IN

  const builtTx: Payment = {
    TransactionType: "Payment",
    Account: bobWallet.classicAddress,
    Destination: aliceWallet.classicAddress,
    Amount: xrpToDrops(10),
  };
  const result = await Xrpld.submit(client, {
    wallet: bobWallet,
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
