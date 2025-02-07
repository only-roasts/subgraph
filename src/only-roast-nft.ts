import {
  DropAdded as DropAddedEvent,
  LitAdded as LitAddedEvent,
  MetadataUpdate as MetadataUpdateEvent,
  TokenMinted as TokenMintedEvent,
  Transfer as TransferEvent,
  OnlyRoastNFT as TokenContract,
} from "../generated/OnlyRoastNFT/OnlyRoastNFT";
import {
  Token,
  User,
  DropAdded,
  LitAdded,
  MetadataUpdate,
  TokenMinted,
  Transfer,
} from "../generated/schema";

import { ipfs, json } from "@graphprotocol/graph-ts";

export function handleDropAdded(event: DropAddedEvent): void {
  let entity = new DropAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.tokenId = event.params.tokenId;
  entity.newDropCount = event.params.newDropCount;
  entity.timestamp = event.params.timestamp;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLitAdded(event: LitAddedEvent): void {
  let entity = new LitAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.tokenId = event.params.tokenId;
  entity.newLitCount = event.params.newLitCount;
  entity.timestamp = event.params.timestamp;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMetadataUpdate(event: MetadataUpdateEvent): void {
  let entity = new MetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity._tokenId = event.params._tokenId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTokenMinted(event: TokenMintedEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    token = new Token(event.params.tokenId.toString());
    token.tokenId = event.params.tokenId;
    token.tokenURI = event.params.uri;

    let metadata = ipfs.cat(event.params.uri);

    if (metadata) {
      let value = json.fromBytes(metadata).toObject();
      if (value) {
        token.name = value.get("name")!.toString();
        token.description = value.get("description")!.toString();
        token.image = value.get("image")!.toString();

        let attributes = value.get("attributes")!.toArray();

        token.walletStatus = attributes[0].toObject().get("value")!.toString();

        token.RoastIntensity = attributes[3]
          .toObject()
          .get("value")!
          .toString();

        token.Advice = attributes[4].toObject().get("value")!.toString();
      }

      let attributes = value.get("attributes")!.toArray();
    }
  }

  token.updatedAtTimestamp = event.block.timestamp;
  token.owner = event.params.to.toHexString();

  token.save();

  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.save();
  }

  let entity = new TokenMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.to = event.params.to;
  entity.tokenId = event.params.tokenId;
  entity.uri = event.params.uri;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.tokenId = event.params.tokenId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
