import { SUCCESS } from "jshooks-api";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Hook = (arg: number) => {
  trace("Base.c: Called.", 0, false);
  return accept("base: Finished.", SUCCESS);
};

export { Hook };
