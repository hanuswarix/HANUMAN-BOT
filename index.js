require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API (Uses Gemini API Key from environment variables)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize Discord Client with necessary Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Bot Ready Event
client.once('ready', async () => {
    console.log(`🤖 HANUMAN HEAD ANGEL is online as ${client.user.tag}`);

    // Register Slash Commands
    const commands = [
        new SlashCommandBuilder()
            .setName('chat')
            .setDescription('Teach or chat directly with Hanuman Head Angel')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('What do you want to teach or say to the bot?')
                    .setRequired(true)
            ),
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            body = commands,
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Handle Messages and Interactions
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Check if someone is asking for help
    const contentLower = message.content.toLowerCase();
    if (contentLower.includes('help') || contentLower.includes('madad') || contentLower.includes('issue') || contentLower.includes('problem')) {
        // Tag the helper role (Replace 'HANUMAN ANGEL' with your actual role name or ID if needed)
        const helperRole = message.guild.roles.cache.find(role => role.name === 'HANUMAN ANGEL');
        const roleMention = helperRole ? `<@&${helperRole.id}>` : '@HANUMAN ANGEL';

        await message.reply(`👋 Hello! Koi user help maang raha hai, please inki help karo! ${roleMention}`);
        return;
    }

    // If bot is mentioned or replied to, respond using Gemini AI persona
    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();

            // Gemini system prompt configuration for persona
            const chatModel = 'gemini-2.5-flash';
            const prompt = `You are HANUMAN HEAD ANGEL, a respectful, friendly, and polite Discord support assistant. 
            Rules: 
            - Never ban, timeout, or punish anyone. 
            - Keep answers short, polite, and use emojis. 
            - Speak in Hinglish. 
            - If you don't know something, tell the user to create a support ticket.
            
            User message: ${message.content}`;

            const response = await ai.models.generateContent({
                model: chatModel,
                contents: prompt,
            });

            const replyText = response.text || "Bhai, mujhe samajh nahi aaya, aap ek naya support ticket create kar lo! 🙏";
            await message.reply(replyText);
        } catch (error) {
            console.error("Gemini Error:", error);
            await message.reply("Arre bhai, kuch error aa gaya hai. Aap ek naya support ticket open kar lo! 🛠️");
        }
    }
});

// Handle Slash Commands (e.g. /chat)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'chat') {
        const userMsg = interaction.options.getString('message');
        await interaction.deferReply();

        try {
            const prompt = `You are HANUMAN HEAD ANGEL, a smart AI assistant learning from the admin. The admin is teaching you: "${userMsg}". Acknowledge this politely, save it in your memory guidelines, and reply in a short, friendly Hinglish tone with emojis.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            await interaction.editReply(response.text || "Memory updated successfully! ✅");
        } catch (error) {
            console.error("Slash Command Error:", error);
            await interaction.editReply("Memory update karne mein kuch issue aa gaya bhai! ⚠️");
        }
    }
});

// Log in using your Discord Bot Token
client.login(process.env.DISCORD_BOT_TOKEN);
