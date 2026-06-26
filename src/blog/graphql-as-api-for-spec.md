---
layout: layouts/article.njk
title: GraphQL as an API for a Specification
author: Anatoly Tenenev
authorUrl: https://github.com/anatoly-tenenev
date: 2026-06-26
permalink: /blog/graphql-as-api-for-spec/
tags:
  - blog
description: How GraphQL can act as a query interface for structured specifications and help agents retrieve precise context slices.
ogType: article
---

Over time, projects accumulate many kinds of specifications: requirements, feature descriptions, architectural decisions, statuses, links between services, constraints, and edge cases.

When a person works with this material, Markdown files are often good enough. A person can open the right section, follow links, read nearby documents, and reconstruct the missing context.

With an agent, the situation is different. Passing the entire specification into context is not always useful. A large amount of text consumes context and adds noise. A fragment that is too small can miss important relationships.

So for an agent, the text of the specification is not enough. It also needs a way to get the right slice: complete enough for the task, but without unnecessary details.

## Specification as Structure

A typical specification often looks like a set of files. Inside, there are headings, links, metadata, naming conventions, and folder structure. Some of these rules are formal. Some exist only as team agreements.

For a tool or an agent, this may not be enough. It needs to understand explicitly:

- what types of entities exist in the specification;
- what fields they can have;
- which fields are required;
- what relationships exist between entities;
- how to filter the data;
- how to request only the required fields.

Spec Schema describes this structure in a machine-readable way. It allows the specification to be treated not only as text, but also as a set of typed entities with metadata, sections, and relationships.

This is useful on its own: such a specification can be validated, indexed, checked, and used by tools. But for an agent, one more layer is needed: a convenient query language for this structure.

## Why GraphQL

I chose GraphQL as the access layer for the specification.

Here, GraphQL is not used as a server technology for a frontend. It is used as a query language for structured data. The specification becomes the data source, and GraphQL becomes the way to retrieve the required fragment.

There is a practical reason for this choice: agents already know GraphQL. Large language models have seen many GraphQL schemas and queries. They are familiar with `type`, `field`, `query`, arguments, filters, and nested selections.

If we invent a separate DSL for querying a specification, we have to explain its rules to the agent every time. That explanation also takes space in the context. With GraphQL, part of this knowledge is already available to the model, so the context only needs to include the specific schema of the specification, not a description of a new language.

GraphQL also works well for selecting slices of data. A query explicitly states which entities are needed, which fields should be returned, and which relationships should be expanded. This matches the main task: give the agent not the whole specification, but only the data needed for the current step.

## Example Query

Suppose an agent needs to get a list of active features. It does not need all documents and all fields. The identifier, slug, and status are enough.

The query may look like this:

```graphql id="lrrrfh"
query {
  feature(where: { meta: { status: { eq: active } } }) {
    items {
      id
      slug
      meta {
        status
      }
    }
  }
}
```

This query defines a clear slice:

- entity: `feature`;
- condition: `status = active`;
- fields: `id`, `slug`, `meta.status`.

If the agent needs more data, it can make another query: for example, expand the feature owner, related requirements, or dependent services. These details do not have to be added in advance.

## GraphQL as an API for a Specification

In this model, the agent works with the specification almost like with an API.

First, it gets information about the available schema: which entities exist, which fields can be requested, and which filters are supported. Then it builds a GraphQL query and receives the result in a compact JSON format.

This is different from the "read all documents and find the answer" approach. The agent does not parse the entire specification folder and does not try to infer the structure from text. It queries a known data model.

For a person, the specification can still remain Markdown documentation. For an agent, a structured interface appears on top of it.

## How This Differs from Search

Search and RAG are useful when you need to find relevant text fragments. For example, when a question is written in natural language and it is not clear in advance which document contains the answer.

But in a specification, structure often matters as much as text: entity type, status, identifier, relationships, required fields. In these cases, it is more convenient to query the data directly.

Search can answer the question: "Where does the documentation mention active features?"
A GraphQL query can answer it differently: "Return all `feature` entities with status `active` and only these fields."

These approaches do not conflict. Search helps find text. GraphQL helps retrieve structured slices of the specification.

## Context as a Resource

The main benefit of this approach is more precise context management.

An agent can work iteratively:

1. inspect the available schema;
2. request a general list of entities;
3. select the required fields;
4. expand relationships when needed;
5. retrieve the next slice.

Each step adds only the data needed for the task to the context. This reduces noise and makes the agent's behavior more predictable.

## Conclusion

Spec Schema defines the structure of a specification. GraphQL gives the agent a query language for that structure.

This makes it possible to use a specification not only as a set of documents for humans, but also as an API for a tool or an agent.

This approach does not require replacing Markdown or changing how documentation is written. It adds a machine-readable layer on top of existing materials.

As a result, the agent receives not the entire specification, but a precise slice: the required entities, fields, and relationships.
