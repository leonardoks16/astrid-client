import { createClient } from "../src";

const client = createClient({ endpoint: "https://api.example.com/graphql" });

const data = await client.mutation<
  { createPost: { id: string; title: string } },
  { input: { title: string } }
>({
  mutation: `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { id title }
  }`,
  variables: { input: { title: "Hello" } },
});

console.log(data.createPost.id);
