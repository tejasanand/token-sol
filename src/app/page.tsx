import { Create } from "./TokenComponents/Create";
import { Burn } from "./TokenComponents/Burn";
import { Transfer } from "./TokenComponents/Transfer";
import { Delegate } from "./TokenComponents/Delegate";

import React from "react";

export default function CreateToken() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-10 py-10">
      <h1 className="font-bold text-4xl">Make your own token</h1>
      <Create />
      <Burn />
      <Transfer />
      <Delegate />
    </div>
  );
}
