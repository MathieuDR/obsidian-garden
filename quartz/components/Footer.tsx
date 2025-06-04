import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
        <div class="kit">
          <script src="https://f.convertkit.com/ckjs/ck.5.js"></script>
          <form
            action="https://app.kit.com/forms/8145391/subscriptions"
            class="seva-form formkit-form"
            method="post"
            data-sv-form="8145391"
            data-uid="12a2816a55"
            data-format="inline"
            data-version="5"
            data-options='{"settings":{"after_subscribe":{"action":"message","success_message":"Success! Now check your email to confirm your subscription.","redirect_url":""},"analytics":{"google":null,"fathom":null,"facebook":null,"segment":null,"pinterest":null,"sparkloop":null,"googletagmanager":null},"modal":{"trigger":"timer","scroll_percentage":null,"timer":5,"devices":"all","show_once_every":15},"powered_by":{"show":false,"url":"https://kit.com/features/forms?utm_campaign=poweredby&amp;utm_content=form&amp;utm_medium=referral&amp;utm_source=dynamic"},"recaptcha":{"enabled":false},"return_visitor":{"action":"show","custom_content":""},"slide_in":{"display_in":"bottom_right","trigger":"timer","scroll_percentage":null,"timer":5,"devices":"all","show_once_every":15},"sticky_bar":{"display_in":"top","trigger":"timer","scroll_percentage":null,"timer":5,"devices":"all","show_once_every":15}},"version":"5"}'
            min-width="400 500 600 700 800"
          >
            <div data-style="clean">
              <ul class="formkit-alert formkit-alert-error" data-element="errors" data-group="alert"></ul>
              <div data-element="fields" data-stacked="false" class="seva-fields formkit-fields">
                <div class="formkit-field">
                  <input class="formkit-input" aria-label="Name" name="fields[first_name]" placeholder="Name" type="text" />
                </div>
                <div class="formkit-field">
                  <input
                    class="formkit-input"
                    name="email_address"
                    aria-label="Email Address"
                    placeholder="Email Address"
                    required
                    type="email"
                  />
                </div>
                <button data-element="submit" class="formkit-submit formkit-submit">
                  <div class="formkit-spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span class="">Subscribe</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a class="external" href="https://quartz.jzhao.xyz/">
            Quartz v{version}
          </a>{" "}
          © {year}
        </p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
