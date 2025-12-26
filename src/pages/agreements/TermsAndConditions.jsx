/* eslint-disable max-len */
import { Box, Button, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { setBetaAgreedAt } from '../../apiServices';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import { useUserMetadata } from '../../shared/context/UserMetadataProvider';

function TermsAndConditions() {
  const { showAlert } = useContext(ErrorContext);
  const { betaAgreedAt, loadUserMetadata } = useUserMetadata();
  const navigate = useNavigate();

  const handleAgree = async () => {
    try {
      await setBetaAgreedAt();
      await loadUserMetadata();
      navigate('/');
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to update preferences: ${error.message}`,
      });
    }
  };

  return (
    <Box alignItems='center' display='flex' flexDirection='column' height='100%' sx={{ overflow: 'auto' }}>
      <Box height='100%' width='50%'>
        <Typography gutterBottom variant='h4'>
          Terms of Service
        </Typography>
        <Typography gutterBottom variant='body1'>
          {`This Terms of Service Agreement ("Agreement") is a contract between you, whether as an individual or entity ("you" or "Licensee"), and Tread International Corporation ("Tread" or "Licensor"). By signing up to use an account through Tread's self-hosted trading platform, inclusive of a web interface and REST API access for order management, direct connections to multiple exchanges/brokers, and transaction cost analysis tools (the "Services"), you agree that you have read, understood, and accepted all terms in this Agreement as well as our Privacy Policy.`}
        </Typography>
        <Typography gutterBottom variant='body1'>
          If you do not agree, you may not use the Services.
        </Typography>
        <Typography gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }} variant='body1'>
          THE TERMS CONTAIN AN ARBITRATION PROVISION. YOU AGREE AND UNDERSTAND THAT DISPUTES ARISING UNDER THESE TERMS SHALL BE SETTLED IN BINDING ARBITRATION. YOU ALSO AGREE AND UNDERSTAND THAT ENTERING INTO THIS AGREEMENT CONSTITUTES A WAIVER OF YOUR RIGHT TO A TRIAL BY JURY OR PARTICIPATION IN A CLASS ACTION LAWSUIT OR A JURY TRIAL.
        </Typography>
        <Box mb={2} mt={2}>
          <Typography variant='h6'>1. Definitions</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='1.1 Authorized End User'
                secondary='means an individual you authorize (e.g., employee or contractor) to access the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.2 Beta Features'
                secondary='means any feature or functionality labeled alpha, beta, preview, early access, or similar.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.3 Confidential Information'
                secondary='means nonpublic information disclosed by one party to the other that is marked or reasonably understood to be confidential, including business, technical, financial, security, product roadmaps, customer data, and the terms of this Agreement, but excluding information that is public without breach, already known without duty, independently developed, or rightfully received from a third party without duty.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.4 Content'
                secondary='means documentation, market data, analytics, text, images, UI, and other materials Tread makes available through the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.5 De-identified Data'
                secondary='means data stripped of personal identifiers such that individuals are not reasonably identifiable.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.6 Exchange API Keys'
                secondary='means exchange- or broker-issued credentials enabling programmatic access for trading/account functions.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.7 Licensee Data'
                secondary='means data you or your Authorized End Users submit to or generate through the Services (e.g., orders, trades, logs, Exchange API Keys).'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.8 Passwords'
                secondary='means all IDs, passwords, passkeys, tokens, API keys, and other credentials used to access the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.9 Tread Account'
                secondary='means the account you register to access the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='1.10 Third-Party Materials'
                secondary='means websites, protocols, exchanges, brokers, data feeds, SDKs, libraries, clouds, infrastructure, or other third-party products/services referenced by, integrated with, connected to, or used in connection with the Services.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>2. Tread Services and Use</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='2.1 Services.'
                secondary='Through your Tread Account you may connect your own exchange/broker accounts to buy/sell digital assets and use trading algorithms, documentation, market data, analytics, and other Content. Transactions execute through your linked accounts. Tread or its affiliates may initiate instructions through your linked accounts solely to carry out your configured purchases and sales.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.2 Limited License.'
                secondary='Subject to this Agreement, Tread grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your internal business purposes. All rights not expressly granted are reserved by Tread and its licensors.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.3 Eligibility.'
                secondary='You must be 18 years old to use the Services and represent that you are of such age in doing so. If you are using the Services on behalf of a legal entity, you further represent and warrant that the legal entity is duly organized and validly existing under the applicable laws of the jurisdiction of its organization, and you are duly authorized by such legal entity to act on its behalf.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.4 Permitted Use; Export/Sanctions.'
                secondary='You will not use the Services for unlawful or undesirable activity (including money laundering, gambling, adult services, counterfeit goods, or predatory practices). You will comply with export control and sanctions laws (including U.S. embargoes and restricted party rules) and will not use geo-evasion (e.g., VPN/IP spoofing) to circumvent restrictions.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.5 System Requirements.'
                secondary='You are responsible for internet access, hosting, hardware, software, integrations, and any required infrastructure. Failures in your systems are not Tread&apos;s responsibility.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.6 Electronic Communications.'
                secondary='You agree and consent to receive electronically all communications, agreements, documents, notices, and disclosures (&quot;Communications&quot;) that Tread provides in connection with your Tread Account and your use of the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.7 Security.'
                secondary='You are responsible for maintaining adequate security and control of all IDs, passwords, PINs, API keys, and any other credentials used to access the Services. Any compromise of this information may result in unauthorized access to your Tread Account.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.8 Authorized Agents and Integrations.'
                secondary='If you authorize third parties or integrations to access the Services or your Tread Account, you are fully responsible for their actions and any resulting consequences, charges, or breaches.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.9 Title.'
                secondary='You represent you lawfully own or control any external wallet or exchange/broker account you link.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.10 Ownership and Feedback.'
                secondary='The Services, Content, and all related IP are owned by Tread and its licensors. Feedback, suggestions, and ideas (&quot;Feedback&quot;) you provide are assigned to Tread without restriction or obligation.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.11 Suspension.'
                secondary='Tread may suspend or limit Services (with notice where practicable) if required by law/regulator; for security, integrity, misuse, or risk; for delinquent fees; or for breach.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.12 Service Changes.'
                secondary='Tread may add, modify, or discontinue features. If a change materially reduces core functionality you are then using, Tread will provide notice where practicable.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.13 Beta Features.'
                secondary='Beta Features are provided "as is," may be changed or withdrawn at any time, and are excluded from any service-level commitments or warranties.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.14 Third-Party Materials and Costs.'
                secondary='The Services may reference or route to Third-Party Materials. You are solely responsible for third-party fees/costs (e.g., exchange, connectivity, infrastructure); Tread may reasonably estimate and pass through such costs.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='2.15 Non-Custodial; No Advisory Relationship.'
                secondary='Tread does not custody assets, is not your broker, intermediary, advisor, or fiduciary, and does not recommend trades or strategies. You are solely responsible for your decisions, compliance obligations, and outcomes.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>3. Creating a Tread Account</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='3.1 Registration.'
                secondary='You must register and provide accurate, current information. Tread may refuse to offer the Services to any person or entity.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='3.2 Credentials.'
                secondary='You are responsible for all activity under your Tread Account and for maintaining credential confidentiality.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>4. General Prohibitions</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='4.1 Prohibited Conduct.'
                secondary='You will not, and will not permit others to: (a) access non-public areas of the Services or Tread systems; (b) bypass or test security controls; (c) use unauthorized interfaces; (d) reverse engineer, decompile, or derive source code from the Services; (e) copy, translate, or create derivative works of the Services; (f) resell, rent, lease, sublicense, time-share, or provide service bureau access; (g) exceed user/access limits; (h) scrape, crawl, or harvest non-public data; (i) benchmark or monitor the Services for competitive purposes without Tread&apos;s prior written consent; (j) use geo-evasion to circumvent export/sanctions controls; (k) send deceptive or falsified source-identifying information; or (l) interfere with or disrupt the Services.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='4.2 Enforcement.'
                secondary='Tread may investigate violations and take appropriate action, including suspension or termination.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>5. Fees and Payments</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='5.1 Service Fees.'
                secondary='Tread may charge fees for use of the Services. Fees are non-refundable unless otherwise agreed.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='5.2 Taxes and Pass-Through Costs.'
                secondary='You are responsible for applicable taxes and third-party costs incurred by your use.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>6. Confidentiality</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='6.1 Confidentiality.'
                secondary='You will protect Tread&apos;s Confidential Information with at least reasonable care, use it only to perform under this Agreement, disclose it only to affiliates, employees, contractors, advisors, or regulators with a need to know who are bound by confidentiality, and, where lawful, provide prompt notice of compelled disclosure and limit disclosure.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>7. Warranties and Disclaimers</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='7.1 Tread Warranty Disclaimer.'
                secondary='THE SERVICES, CONTENT, ANY BETA FEATURES, AND ANY CONNECTIONS TO OR USE OF THIRD-PARTY MATERIALS ARE PROVIDED "AS IS" AND "AS AVAILABLE." TREAD AND ITS LICENSORS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, QUIET ENJOYMENT, UNINTERRUPTED OR ERROR-FREE OPERATION, OR FREEDOM FROM MALWARE. NO ADVICE OR INFORMATION CREATES ANY WARRANTY.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='7.3 Licensee Warranty.'
                secondary='You warrant you have all rights, consents, and notices to provide Licensee Data and instruct Tread to process it in compliance with applicable law (including data protection, export, and sanctions).'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>8. Limitation of Liability</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='8.1 Excluded Damages.'
                secondary='TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER TREAD, NOR TREAD&apos;S LICENSORS, ARE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES; LOSS OF PROFITS, REVENUE, GOODWILL, OR DATA; BUSINESS INTERRUPTION; OR COSTS OF SUBSTITUTE GOODS/SERVICES, EVEN IF ADVISED OF THE POSSIBILITY AND REGARDLESS OF THEORY.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='8.2 Liability Cap.'
                secondary='Tread&apos;s total aggregate liability for all claims arising out of or relating to the Services or this Agreement will not exceed the total fees actually paid by you to Tread during the calendar year in which the liability arose or the equivalent of USD 100. The cap is aggregate and not per claim.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='8.3 Avoidable Losses; Third-Party/Force-Majeure Risks.'
                secondary='Neither Tread not Tread&apos;s licensors are liable for losses it could have avoided with reasonable care or mitigation, nor for failures, delays, errors, or interruptions caused by events beyond reasonable control, including acts of God; war, terrorism, civil unrest; labor disputes; power, internet, or cloud provider failures; DDoS or other attacks; exchange/protocol outages; or third-party non-performance.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='8.4 Jurisdictional Limits.'
                secondary='Some jurisdictions do not allow certain exclusions or limits; where applicable, liability is limited to the fullest extent permitted.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>9. Indemnification</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='9.1 Your Indemnity.'
                secondary={`To the fullest extent allowed by law, you will indemnify, defend, and hold harmless Tread, its affiliates, service providers, licensors, and their respective officers, directors, employees, and agents (the "Indemnified Parties") from and against any and all claims, demands, actions, subpoenas, investigations, or proceedings; and all related losses, damages, liabilities, penalties, fines, costs, and expenses (including reasonable attorneys' fees and costs) (collectively, "Indemnified Amounts") arising out of or related to: (a) your or any Authorized End User's use of the Services (including actions by third parties using your Tread Account or Passwords); (b) Licensee Data; (c) your customizations, configurations, integrations, or modifications; (d) your breach of this Agreement or violation of law (including data protection, export control, and sanctions laws); and (e) your use of or interactions with Third-Party Materials.`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='9.2 Procedure and Control.'
                secondary={`Tread will attempt to provide notice of a claim to your designated contact (failure to deliver notice will not eliminate or reduce your obligations to the extent not materially prejudicial). You will not settle any claim without Tread's prior written consent. Tread may, at its sole discretion, elect to assume control of the defense and settlement of any claim; you will cooperate and promptly reimburse Indemnified Amounts.`}
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>10. Dispute Resolution and Arbitration</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='10.1 Arbitration.'
                secondary='Any dispute arising from or relating to this Agreement or the Services will be resolved by binding arbitration administered by JAMS (or AAA if JAMS is unavailable) under its applicable rules. The seat is New York, New York; the language is English; one arbitrator will preside (three for claims reasonably exceeding USD $1,000,000). Discovery will be limited to what is reasonably necessary. Judgment may be entered in any court of competent jurisdiction.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='10.2 Injunctive Relief.'
                secondary='Tread may seek injunctive or equitable relief in court to protect confidentiality or intellectual property.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='10.3 Jury Trial and Class Action Waiver.'
                secondary='YOU WAIVE ANY RIGHT TO A JURY TRIAL. YOU MAY BRING CLAIMS AGAINST EACH OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. IF THIS WAIVER IS FOUND UNENFORCEABLE AS TO A CLAIM, THE AGREEMENT TO ARBITRATE IS NULL AND VOID SOLELY AS TO THAT CLAIM.'
              />
            </ListItem>
          </List>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>11. Governing Law</Typography>
          <Typography gutterBottom variant='body1'>
            This Agreement is governed by the laws of the State of New York, without regard to conflict-of-laws principles. Venue for permitted court actions lies exclusively in the state or federal courts located in New York, New York, and the parties consent to personal jurisdiction there.
          </Typography>
        </Box>

        <Box mb={2} mt={2}>
          <Typography variant='h6'>12. Miscellaneous</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary='12.1 Entire Agreement.'
                secondary='This Agreement constitutes the entire understanding regarding the Services and supersedes prior or contemporaneous terms.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.2 Modifications.'
                secondary='Tread may modify this Agreement; material changes will be notified by posting or email. Continued use after the effective date constitutes acceptance.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.3 Assignment.'
                secondary={`You may not assign or transfer this Agreement without Tread's prior written consent. Tread may assign freely (including in a merger, acquisition, or sale of assets or business).`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.4 Waiver and Severability.'
                secondary={`No waiver is effective unless in writing. If any provision is unenforceable, it will be limited or replaced with an enforceable term that most closely reflects the parties' intent, and the remainder remains in effect.`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.5 No Third-Party Beneficiaries.'
                secondary={`Except Tread's licensors and service providers (with respect to Sections 7–9), no third party has rights under this Agreement.`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.6 Force Majeure.'
                secondary='Neither party is liable for delay or failure due to causes beyond reasonable control as described in Section 8.3, provided the affected party uses reasonable efforts to mitigate.'
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary='12.8 Survival.'
                secondary={`Provisions that, by their nature, should survive termination of this Agreement shall survive termination. By way of example, all of the following will survive termination: any obligation you have to pay Tread (if applicable) or indemnify Tread, any limitations on Tread's liability, any terms regarding ownership or intellectual property rights, and terms regarding disputes.`}
              />
            </ListItem>
          </List>
        </Box>

        <Typography gutterBottom sx={{ fontStyle: 'italic', mt: 2 }} variant='body2'>
          Last Updated: January 2025
        </Typography>
        <Stack
          alignItems='center'
          direction='column'
          display='flex'
          justifyContent='center'
          paddingBottom='32px'
          spacing={2}
          width='100%'
        >
          <Button disabled={!!betaAgreedAt} sx={{ width: '200px' }} variant='contained' onClick={handleAgree}>
            I Agree
          </Button>
          {!!betaAgreedAt && (
            <Box>
              <Typography gutterBottom variant='body1'>
                {`You have already accepted the Terms of Service on: ${new Date(betaAgreedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default TermsAndConditions;
