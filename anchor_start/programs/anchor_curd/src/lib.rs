#![allow(deprecated)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

// 使用有效的 Solana 程序 ID（这是一个示例 ID，您应该替换为您自己的）
// 生成方法：
// 1. 在命令行运行：`solana-keygen new --no-outfile`
// 2. 然后运行：`solana address`
declare_id!("E2Ht5YytrL863sL8VvQ4WrZ7VLP8Dd57jrFpyeML2GQ2"); // 示例 ID，请替换

#[program]
pub mod anchor_curd {
    use super::*;

    pub fn create(ctx: Context<Create>, message:String) -> Result<()> {
        msg!("Create Message: {}", message);
        let message_account = &mut ctx.accounts.message_account;
        message_account.user = ctx.accounts.user.key();
        message_account.message = message;
        message_account.bump = ctx.bumps.message_account;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, message: String) -> Result<()> {
        msg!("Update Message: {}", message);
        let message_account = &mut ctx.accounts.message_account;
        message_account.message = message;

        // 从用户账户向 Vault 账户转账 0.001 SOL（1_000_000 lamports）
        let transfer_accounts = Transfer{
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
        };
        
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(), 
            transfer_accounts
        );
        transfer(cpi_context, 1_000_000)?;
        Ok(())
    }

    pub fn delete(ctx: Context<Delete>) -> Result<()> {
        msg!("Delete Message");
        let user_key = ctx.accounts.user.key();
        let signer_seeds:&[&[&[u8]]] = 
            &[&[b"vault", user_key.as_ref(), &[ctx.bumps.vault_account]]];

        let transfer_accounts = Transfer{
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_accounts,
            signer_seeds
        );

        transfer(cpi_context, ctx.accounts.vault_account.lamports())?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(message: String)]
pub struct Create<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + MessageAccount::INIT_SPACE,
        seeds = [b"message", user.key().as_ref()],
        bump,
    )]
    pub message_account: Account<'info, MessageAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(message: String)]
pub struct Update<'info>{
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump,
    )]
    pub vault_account: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"message", user.key().as_ref()],
        bump = message_account.bump,
        realloc = 8 + MessageAccount::INIT_SPACE,
        realloc::payer = user,
        realloc::zero = true,
    )]
    pub message_account: Account<'info, MessageAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Delete<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump,
    )]
    pub vault_account: SystemAccount<'info>,
    #[account(
        mut,
        close = user,
        seeds = [b"message", user.key().as_ref()],
        bump = message_account.bump,
    )]
    pub message_account: Account<'info, MessageAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MessageAccount {
    pub user: Pubkey,
    #[max_len(255)]
    pub message:String,
    pub bump: u8,
}