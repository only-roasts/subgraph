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

import {
  json,
  Bytes,
  dataSource,
  log,
  BigInt,
  JSONValueKind,
} from "@graphprotocol/graph-ts";

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
    token.externalURL = `https://testnets.opensea.io/assets/base_sepolia/0x0e377f36381cf3ec3ec23c17b65b57fa4d6ce5cb/${event.params.tokenId.toString()}`;

    // Extract CID from the URI (supports both HTTP and IPFS URIs)
    const uri = event.params.uri;
    let cidWithPath: string;

    if (uri.startsWith("ipfs://")) {
      // Handle IPFS URI (e.g., ipfs://CID/metadata.json)
      cidWithPath = uri.replace("ipfs://", "");
    } else {
      // Handle HTTP URL (e.g., Pinata gateway)
      const parts = uri.split("/ipfs/");
      if (parts.length < 2) {
        log.error("Invalid URI format: {}", [uri]);
        return;
      }
      cidWithPath = parts[1];
    }

    // Set the ipfsURI to the CID (linked to TokenMetadata)
    token.ipfsHashURI = cidWithPath;

    // Create the File Data Source
    TokenMetadataTemplate.create(cidWithPath);

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

  const value = json.fromBytes(content).toObject();
  if (!value) {
    log.warning("JSON content is not an object", []);
    return;
  }

  const name = value.get("name");
  const description = value.get("description");
  const image = value.get("image");
  const attributes = value.get("attributes");

  if (
    name &&
    name.kind === JSONValueKind.STRING &&
    description &&
    description.kind === JSONValueKind.STRING &&
    image &&
    image.kind === JSONValueKind.STRING &&
    attributes &&
    attributes.kind === JSONValueKind.ARRAY
  ) {
    tokenMetadata.name = name.toString();
    tokenMetadata.description = description.toString();
    tokenMetadata.image = image.toString();

    const attributesArray = attributes.toArray();

    // Initialize default values
    tokenMetadata.traitType0 = "";
    tokenMetadata.value0 = "";
    tokenMetadata.traitType1 = "";
    tokenMetadata.value1 = "";
    tokenMetadata.traitType2 = "";
    tokenMetadata.value2 = "";
    tokenMetadata.traitType3 = "";
    tokenMetadata.value3 = "";
    tokenMetadata.traitType4 = "";
    tokenMetadata.value4 = "";

    for (let i = 0; i < attributesArray.length; i++) {
      const attributeObject = attributesArray[i].toObject();
      if (attributeObject) {
        const trait_type = attributeObject.get("trait_type");
        const value = attributeObject.get("value");

        if (
          trait_type &&
          trait_type.kind === JSONValueKind.STRING &&
          value &&
          value.kind === JSONValueKind.STRING
        ) {
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
            default:
              log.warning(
                "More than 5 attributes found; ignoring extra attributes.",
                []
              );
              break;
          }
        }
      }
    }

    tokenMetadata.save();
  } else {
    log.warning("Missing or invalid JSON fields for TokenMetadata.", []);
  }
}
