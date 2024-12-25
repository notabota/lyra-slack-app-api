import NextAuth from "next-auth"
import SlackProvider from "next-auth/providers/slack"

const handler = NextAuth({
    providers: [
        SlackProvider({
            clientId: process.env.SLACK_CLIENT_ID!,
            clientSecret: process.env.SLACK_CLIENT_SECRET!
        })
    ]
})

export { handler as GET, handler as POST }