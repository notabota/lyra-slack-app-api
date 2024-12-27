import NextAuth from "next-auth"
import SlackProvider from "next-auth/providers/slack"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
    providers: [
        SlackProvider({
            clientId: process.env.SLACK_CLIENT_ID!,
            clientSecret: process.env.SLACK_CLIENT_SECRET!
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }