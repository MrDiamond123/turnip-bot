const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, MessageFlags } = require("discord.js")
const { formatHex, clampChroma } = require('culori')
module.exports = {
    data: new SlashCommandBuilder()
        .setName("color")
        .setContexts(InteractionContextType.Guild)
        .setDescription("color roles")
        .addStringOption(option => option.setName("color").setDescription("Color in either hex, rgb, or whatever css supports").setRequired(true))
    ,
    async execute(interaction) {
        let guild = interaction.guild;

        let roles = await guild.roles.fetch();
        let colorRoles = roles.filter(role => role.name.trim().toLowerCase().includes("color-"))

        const color = formatHex(interaction.options.getString("color"))
        if (!color) {
            return await interaction.reply("That ain't a color chief")
        }
        const role = colorRoles.filter(role => role.name.trim().toLowerCase() == (`Color-${color}`).trim().toLowerCase()).first() || await guild.roles.create({ name: `Color-${color}`, colors: { primaryColor: color }, mentionable: false });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Your color was set to ${color}`)
            .setDescription("You have successfully set your color! If anyone also wants that color, they can yoink it!")

        const yoinkButton = new ButtonBuilder().setCustomId('yoink').setLabel("Yoink").setStyle(ButtonStyle.Primary)
        const row = new ActionRowBuilder().addComponents(yoinkButton)

        await interaction.member.roles.remove(colorRoles)
        await interaction.member.roles.add(role)

           // prune unused colors
        if (Math.floor(Math.random() * 5) === 4) {
            console.log(guild.id, "color role pruning event triggered, removing all unused color roles for this guild")
            await guild.members.fetch();
            const unusedRoles = colorRoles.filter(role => role.members.size === 0)
            unusedRoles.each(role => {
                console.debug(guild.id, "unused roles:", role.name, role.members.count)
                role.delete();
            })
            embed.setFooter({text:`this command triggered the color role prune action, saving you roles!`})
        }


        const response = await interaction.reply({ embeds: [embed], components: [row], withResponse: true })

     

        const collector = response.resource.message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3_600_000,
        })
        collector.on('collect', async (i) => {
            if (i.member.roles.cache.has(role.id)) {
                await i.reply({ content: `You already have this color, silly!`, flags: [MessageFlags.Ephemeral] })
            } else {
                await i.member.roles.remove(colorRoles)
                await i.member.roles.add(role)
                await i.reply({ content: `You yoinked the color!`, flags: [MessageFlags.Ephemeral] })
                await interaction.followUp({ content: `${i.member} yoinked this color!`, flags: [MessageFlags.Ephemeral] })

            }
        })

    },
}