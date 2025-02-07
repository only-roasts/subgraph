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
  TokenMetadata,
  User,
  DropAdded,
  LitAdded,
  MetadataUpdate,
  TokenMinted,
  Transfer,
} from "../generated/schema";

import { TokenMetadata as TokenMetadataTemplate } from "../generated/templates";

import { json, Bytes, dataSource, log, BigInt } from "@graphprotocol/graph-ts";

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
    token.owner = event.params.to.toHexString();
    token.tokenID = event.params.tokenId;
    token.tokenURI = event.params.uri;
    token.lits = BigInt.fromI32(0);
    token.drops = BigInt.fromI32(0);
    token.ipfsHashURI = event.params.uri;
    token.externalURL = `https://testnets.opensea.io/assets/base_sepolia/0x0e377f36381cf3ec3ec23c17b65b57fa4d6ce5cb/${event.params.tokenId.toString()}`;

    TokenMetadataTemplate.create(event.params.uri);

    token.updatedAtTimestamp = event.block.timestamp;

    token.save();

    let user = User.load(event.params.to.toHexString());
    if (!user) {
      user = new User(event.params.to.toHexString());
      user.address = event.params.to;
      user.save();
    }
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

export function handleMetadata(content: Bytes): void {
  let tokenMetadata = new TokenMetadata(dataSource.stringParam());
  // Create a new TokenMetadata entity and pass in the dataSource as its ID. This is the ipfsHashUri that we created in the handleTransfer function above.

  const value = json.fromBytes(content).toObject();
  // Create a value variable that will be used to store the json object that is passed in as the content parameter.
  if (value) {
    const image = value.get("image");
    const name = value.get("name");
    const attributes = value.get("attributes");
    const description = value.get("description");

    // Assemblyscript needs to have nullchecks. If the value exists, then we can proceed with the creating an image, name, and attributes variable gathered from the json object.

    if (name && image && attributes && description) {
      tokenMetadata.name = name.toString();
      tokenMetadata.image = image.toString();
      tokenMetadata.description = description.toString();
      const attributesArray = attributes.toArray();

      // Assign the name and image object to the tokenMetadata.name and tokenMetadata.image fields. Then, create an attributesArray variable that will be used to store the attributes object as an array. Converting to an array allows us to first loop through the array with the `switch` statement below, then assign the trait_type and value to the tokenMetadata fields.

      if (attributesArray) {
        for (let i = 0; i < attributesArray.length; i++) {
          const attributeObject = attributesArray[i].toObject();
          const trait_type = attributeObject.get("trait_type");
          const value = attributeObject.get("value");

          if (trait_type && value) {
            switch (i) {
              case 0:
                tokenMetadata.traitType0 = trait_type.toString();
                tokenMetadata.value0 = value.toString();
                break;
              case 1:
                tokenMetadata.traitType1 = trait_type.toString();
                tokenMetadata.value1 = value.toString();
                break;
              case 2:
                tokenMetadata.traitType2 = trait_type.toString();
                tokenMetadata.value2 = value.toString();
                break;
              case 3:
                tokenMetadata.traitType3 = trait_type.toString();
                tokenMetadata.value3 = value.toString();
                break;
              case 4:
                tokenMetadata.traitType4 = trait_type.toString();
                tokenMetadata.value4 = value.toString();
                break;
            }
          }
        }
      }
      tokenMetadata.save();
    }
  }
}
