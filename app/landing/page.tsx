import BlockOne from "@/components/ui/landing-blocks/blockOne"
import BlockTwo from "@/components/ui/landing-blocks/blockTwo"
import BlockThree from "@/components/ui/landing-blocks/blockThree"
import BlockFour from "@/components/ui/landing-blocks/blockFour"
import BlockFive from "@/components/ui/landing-blocks/blockFive"
import BlockSeven from "@/components/ui/landing-blocks/blockSeven"
import BlockEight from "@/components/ui/landing-blocks/blockEight"
import BlockNine from "@/components/ui/landing-blocks/blockNine"
import ContactMapBlock from "@/components/ui/landing-blocks/contactMapBlock"
import FooterBlock from "@/components/ui/landing-blocks/footerBlock"
import ScrollToTopButton from "@/components/ui/landing-blocks/scrollToTopButton"

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-[72px]">
      <BlockOne />
      <BlockTwo />
      <BlockThree />
      <BlockFour />
      <BlockFive />
      <BlockSeven />
      <BlockEight />
      <BlockNine />
      <ContactMapBlock />
      <FooterBlock />
      <ScrollToTopButton />
    </div>
  )
}
