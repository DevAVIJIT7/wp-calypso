/** @format */

/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { localize } from 'i18n-calypso';

/**
 * Internal Dependencies
 */
import Main from 'components/main';
import {
	getCurrentPlan,
	isCurrentPlanExpiring,
	isRequestingSitePlans,
} from 'state/sites/plans/selectors';
import { isFreeJetpackPlan } from 'lib/products-values';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';
import { isJetpackSite } from 'state/sites/selectors';
import DocumentHead from 'components/data/document-head';
import TrackComponentView from 'lib/analytics/track-component-view';
import PlansNavigation from 'my-sites/domains/navigation';
import ProductPurchaseFeaturesList from 'blocks/product-purchase-features-list';
import CurrentPlanHeader from './header';
import QuerySites from 'components/data/query-sites';
import QuerySitePlans from 'components/data/query-site-plans';
import { getPlan } from 'lib/plans';
import QuerySiteDomains from 'components/data/query-site-domains';
import { getDecoratedSiteDomains } from 'state/sites/domains/selectors';
import DomainWarnings from 'my-sites/domains/components/domain-warnings';
import isSiteAutomatedTransfer from 'state/selectors/is-site-automated-transfer';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import JetpackChecklist from 'my-sites/plans/current-plan/jetpack-checklist';
import { isEnabled } from 'config';
import QueryJetpackPlugins from 'components/data/query-jetpack-plugins';

class CurrentPlan extends Component {
	static propTypes = {
		selectedSiteId: PropTypes.number,
		selectedSite: PropTypes.object,
		isRequestingSitePlans: PropTypes.bool,
		path: PropTypes.string.isRequired,
		domains: PropTypes.array,
		currentPlan: PropTypes.object,
		isExpiring: PropTypes.bool,
		shouldShowDomainWarnings: PropTypes.bool,
		hasDomainsLoaded: PropTypes.bool,
		isAutomatedTransfer: PropTypes.bool,
	};

	isLoading() {
		const { selectedSite, isRequestingSitePlans: isRequestingPlans } = this.props;

		return ! selectedSite || isRequestingPlans;
	}

	render() {
		const {
			selectedSite,
			selectedSiteId,
			domains,
			currentPlan,
			hasDomainsLoaded,
			isAutomatedTransfer,
			isExpiring,
			isJetpack,
			path,
			shouldShowDomainWarnings,
			translate,
		} = this.props;

		const currentPlanSlug = get( selectedSite, [ 'plan', 'product_slug' ] );
		const isLoading = this.isLoading();

		// This may return `undefined`. Be careful!
		const planConstObj = getPlan( currentPlanSlug );

		let title = '';
		let planFeaturesHeader = '';
		if ( planConstObj && 'function' === typeof planConstObj.getTitle ) {
			planFeaturesHeader = translate( '%(planName)s plan features', {
				args: { planName: planConstObj.getTitle() },
			} );

			title = translate( 'Your site is on a %(planName)s plan', {
				args: { planName: planConstObj.getTitle() },
			} );
		}

		let tagLine = translate(
			'Unlock the full potential of your site with all the features included in your plan.'
		);
		if ( planConstObj && 'function' === typeof planConstObj.getTagline ) {
			tagLine = planConstObj.getTagline();
		}

		const shouldQuerySiteDomains = selectedSiteId && shouldShowDomainWarnings;
		const showDomainWarnings = hasDomainsLoaded && shouldShowDomainWarnings;
		return (
			<Main className="current-plan" wideLayout>
				<SidebarNavigation />
				<DocumentHead title={ translate( 'My Plan' ) } />
				<QuerySites siteId={ selectedSiteId } />
				<QuerySitePlans siteId={ selectedSiteId } />
				{ shouldQuerySiteDomains && <QuerySiteDomains siteId={ selectedSiteId } /> }

				{ false /* @TODO Disabled. Errors fixed by #26780. */ && (
					<PlansNavigation path={ path } selectedSite={ selectedSite } />
				) }

				{ showDomainWarnings && (
					<DomainWarnings
						domains={ domains }
						position="current-plan"
						selectedSite={ selectedSite }
						ruleWhiteList={ [
							'newDomainsWithPrimary',
							'newDomains',
							'unverifiedDomainsCanManage',
							'pendingGappsTosAcceptanceDomains',
							'unverifiedDomainsCannotManage',
							'wrongNSMappedDomains',
							'newTransfersWrongNS',
						] }
					/>
				) }

				{ false && (
					<CurrentPlanHeader
						selectedSite={ selectedSite }
						isPlaceholder={ isLoading }
						title={ title }
						tagLine={ tagLine }
						currentPlanSlug={ currentPlanSlug }
						currentPlan={ currentPlan }
						isExpiring={ isExpiring }
						isAutomatedTransfer={ isAutomatedTransfer }
						includePlansLink={ currentPlan && isFreeJetpackPlan( currentPlan ) }
					/>
				) }
				{ isEnabled( 'jetpack/checklist' ) &&
					isJetpack &&
					! isAutomatedTransfer && (
						<Fragment>
							<QueryJetpackPlugins siteIds={ [ selectedSiteId ] } />
							<JetpackChecklist />
						</Fragment>
					) }
				<div
					className={ classNames( 'current-plan__header-text current-plan__text', {
						'is-placeholder': { isLoading },
					} ) }
				>
					<h1 className="current-plan__header-heading">{ planFeaturesHeader }</h1>
				</div>
				<ProductPurchaseFeaturesList plan={ currentPlanSlug } isPlaceholder={ isLoading } />

				<TrackComponentView eventName={ 'calypso_plans_my_plan_view' } />
			</Main>
		);
	}
}

export default connect( state => {
	/* eslint-disable-next-line no-unused-vars */
	const selectedSite = getSelectedSite( state );
	const selectedSiteId = getSelectedSiteId( state );
	const domains = getDecoratedSiteDomains( state, selectedSiteId );

	const isJetpack = isJetpackSite( state, selectedSiteId );
	const isAutomatedTransfer = isSiteAutomatedTransfer( state, selectedSiteId );

	return {
		/* @TODO clean up, this is to force error-producing conditions */
		selectedSite: null,
		selectedSiteId,
		domains,
		isAutomatedTransfer,
		currentPlan: getCurrentPlan( state, selectedSiteId ),
		isExpiring: isCurrentPlanExpiring( state, selectedSiteId ),
		shouldShowDomainWarnings: ! isJetpack || isAutomatedTransfer,
		hasDomainsLoaded: !! domains,
		isRequestingSitePlans: isRequestingSitePlans( state, selectedSiteId ),
		isJetpack,
	};
} )( localize( CurrentPlan ) );
