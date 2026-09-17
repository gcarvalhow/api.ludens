def password_reset_email(reset_url: str) -> tuple[str, str]:
    subject = "Redefinição de senha — Ludens"
    html_body = (
        "<p>Você pediu para redefinir sua senha no Ludens.</p>"
        f'<p><a href="{reset_url}">Clique aqui para escolher uma nova senha</a>. '
        "O link vale por 1 hora e só pode ser usado uma vez.</p>"
        "<p>Se você não pediu essa redefinição, ignore este e-mail — sua senha "
        "continua a mesma.</p>"
    )

    return subject, html_body

def email_change_requested_email(confirm_url: str, new_email: str) -> tuple[str, str]:
    subject = "Confirme a troca de e-mail — Ludens"
    html_body = (
        "<p>Você pediu para trocar o e-mail da sua conta Ludens para "
        f"<strong>{new_email}</strong>.</p>"
        f'<p><a href="{confirm_url}">Clique aqui para confirmar a troca</a>. '
        "O link vale por 1 hora e só pode ser usado uma vez. Ao confirmar, "
        "todas as sessões ativas são encerradas.</p>"
        "<p>Se você não pediu essa troca, ignore este e-mail — nada muda até "
        "que o link seja aberto.</p>"
    )

    return subject, html_body

def email_changed_courtesy_email() -> tuple[str, str]:
    subject = "Seu e-mail foi alterado — Ludens"
    html_body = (
        "<p>O e-mail da sua conta Ludens foi alterado para este endereço.</p>"
        "<p>Se você não reconhece essa mudança, entre em contato com o suporte "
        "o quanto antes.</p>"
    )

    return subject, html_body

def account_deletion_requested_email(confirm_url: str) -> tuple[str, str]:
    subject = "Confirme a exclusão da sua conta — Ludens"
    html_body = (
        "<p>Você pediu para excluir sua conta Ludens.</p>"
        f'<p><a href="{confirm_url}">Clique aqui para confirmar a exclusão</a>. '
        "O link vale por 1 hora e só pode ser usado uma vez. Essa ação não pode "
        "ser desfeita.</p>"
        "<p>Se você não pediu essa exclusão, ignore este e-mail — sua conta "
        "continua ativa.</p>"
    )

    return subject, html_body
