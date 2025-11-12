#![allow(deprecated)]

use anchor_lang::prelude::*;

declare_id!("4kdad4rUQpwUPgHzGWDtBesba3BCaijfiTEZHZAv5HUo");

#[program]
pub mod anchor_start {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        msg!("program id: {:?}", ctx.program_id);
        ctx.accounts.new_account.data = data;
        msg!("New account initialized with data: {:?}!", data);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 8,
    )]
    pub new_account: Account<'info, NewAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NewAccount {
    pub data: u64,
}