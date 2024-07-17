
const Footer = () => {
    return (
        <footer className="home-footer">
        <div className="home-main5">
          <div className="home-branding">
            <div className="home-heading10">
              <h2 className="home-logo2">StockFlip</h2>
              <p className="home-caption17">
                Owning real world assets without having to worry about chains and networks
              </p>
            </div>
            <div className="home-socials1">
              <a
                href="https://twitter.com/dhananj10181396"
                target="_blank"
                rel="noreferrer noopener"
                className="home-twitter1 social button"
              >
                <img
                  alt="image"
                  src="/Icons/twitter.svg"
                  className="home-image32"
                />
              </a>
              <a
                href="https://www.linkedin.com/in/dhananjay-pai/"
                target="_blank"
                rel="noreferrer noopener"
                className="home-discord1 social button"
              >
                <img
                  alt="image"
                  src="/Icons/linkedin-svg.svg"
                  className="home-image33"
                />
              </a>
            </div>
          </div>
          <div className="home-links1">
            <div className="home-list1">
              <h3 className="home-heading11">Website</h3>
              <div className="home-items">
                <button className="home-link02 button-clean button">
                  About
                </button>
                <button className="home-link03 button-clean button">
                  Collection
                </button>
                <button className="home-link04 button-clean button">
                  Roadmap
                </button>
                <button className="home-link05 button-clean button">
                  Features
                </button>
              </div>
            </div>
            <div className="home-list2">
              <h3 className="home-heading12">Company</h3>
              <div className="home-items1">
                <button className="home-link06 button-clean button">
                  Team
                </button>
                <button className="home-link07 button-clean button">
                  Press
                </button>
                <button className="home-link08 button-clean button">
                  Terms
                </button>
                <button className="home-link09 button-clean button">
                  Limitations
                </button>
                <button className="home-link10 button-clean button">
                  Licenses
                </button>
              </div>
            </div>
          </div>
          <div className="home-socials2">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer noopener"
              className="home-twitter2 social button"
            >
              <img
                alt="image"
                src="/Icons/twitter.svg"
                className="home-image34"
              />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer noopener"
              className="home-discord2 social button"
            >
              <img
                alt="image"
                src="/Icons/discord.svg"
                className="home-image35"
              />
            </a>
          </div>
        </div>
        <span className="home-copyright">
          © 2022 Character. All Rights Reserved.
        </span>
      </footer>
    )
};
export default Footer