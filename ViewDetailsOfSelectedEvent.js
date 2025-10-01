import { LightningElement, track, wire, api } from 'lwc';
import getEventCampaigns from '@salesforce/apex/CampaignController.getEventDetailCampaigns';
import getCampaignFilesWithPortalLink from '@salesforce/apex/CampaignController.getGalleryFilesForCampaign';
import getPaymentDetails from '@salesforce/apex/RazorpayOrderController.fetchPaymentDetails';
import {loadScript, loadStyle } from 'lightning/platformResourceLoader';
import viewDetailsOfSelectedEventStyle from '@salesforce/resourceUrl/viewDetailsOfSelectedEventStyle';
import { CurrentPageReference } from 'lightning/navigation';

// Static resources
import jqueryMinJs from '@salesforce/resourceUrl/jqueryMinJs';
import owlCarouselMinJs from '@salesforce/resourceUrl/owlCarouselMinJs';
import owlCarouselMinCss from '@salesforce/resourceUrl/owlCarouselMinCss';
import owlThemeDefaultMiinCss from '@salesforce/resourceUrl/owlThemeDefaultMiinCss';

export default class ViewDetailsOfSelectedEvent extends LightningElement {
    isOwlLoaded = false;
 @track campaignId;
 @track files = [];
    @track campaign = {};
    @track userName = '';
    @track userEmail = '';
    @track Amount = '';
    @track formattedDate;
    @track showCalendar=false;
    @track formattedDateTimeRange;
    @track formattedTimeRange
    @track formattedOnlyDateRange
     
    // Deepak Code Start
    @track isRegisterModalOpen = false;
    @track isPledgeModalOpen = false;
    @track isRecurringDonationYes = false;
    isLibLoaded = false;
    isOwlInit = false;

      connectedCallback() {
        if (this.campaignId) {
            getCampaignFilesWithPortalLink({ campaignId: this.campaignId })
                .then(result => {
                    this.files = result;
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    handlePledge() {
        this.isPledgeModalOpen = true;
    }
    closePledgeModal() {
        this.isPledgeModalOpen = false;
    }
    submiPledgeModal() {
        alert('Pledge confirmed!');
        this.closePledgeModal();
    }
    recurringOptions = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];
    get recurringFreqencyOptions() {
        return [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' }
        ];
    }
    get paymentOptions() {
        return [
            { label: 'UPI', value: 'upi' },
            { label: 'Net banking', value: 'net banking' },
            { label: 'Credit card', value: 'credit card' },
            { label: 'Cheque', value: 'cheque' },
            { label: 'In Kind', value: 'in kind' }
        ];
    }
    openRegisterModal() {
        this.selectedTitle = this.eventDetails?.Name;
        this.selectedStartDate = this.eventDetails?.Event_starts_on__c;
    this.selectedEndDate = this.eventDetails?.Event_ends_on__c;
        this.isRegisterModalOpen = true;
    }

    closeRegisterModal() {
        this.isRegisterModalOpen = false;
    }
    handleRegisterSubmit() {
        // Process form here (you can send values to Apex or show a toast)
        console.log('Name:', this.name);
        console.log('Email:', this.email);
        console.log('Phone:', this.phone);

        this.closeRegisterModal(); // Close modal after submit
    }
    handleAddToCalendar() {
    this.showCalendar = true;
    }
   closeCalendar() {
    this.showCalendar = false;
    }

    handleRecurringChange(event) {
        this.selectedValue = event.detail.value;
        this.isRecurringDonationYes = this.selectedValue === 'Yes';
    }

    // Deepak code end
   
    @api campaignName = 'Annual Tech Conference';

    paymentId;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.paymentId = currentPageReference.state.paymentId;
            if (this.paymentId) {
                this.fetchRazorpayDetails();
            }
        }
    }

    fetchRazorpayDetails() {
        getPaymentDetails({ paymentId: this.paymentId })
            .then(result => {
                console.log('Razorpay Payment Details:', result);
                
            })
            .catch(error => {
                console.error('Error fetching payment details', error);
            });
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.campaignId = currentPageReference.state.campaignId;
            console.log('this.campaignId:',this.campaignId);
            this.fetchCampaign();
        }
    }
    renderedCallback() {
        loadStyle(this, viewDetailsOfSelectedEventStyle)
        // load only once
        if (this.isLibLoaded) {
            // re-init if files are rendered but owl not initialized
            this.refreshCarousel();
            return;
        }
        this.isLibLoaded = true;

        Promise.all([
            loadScript(this, jqueryMinJs),
            loadScript(this, owlCarouselMinJs),
            loadStyle(this, owlCarouselMinCss),
            loadStyle(this, owlThemeDefaultMinCss)
        ])
        .then(() => {
            this.refreshCarousel();
        })
        .catch(error => {
            console.error("Error loading Owl Carousel:", error);
        });
    }

    refreshCarousel() {
        // wait until DOM has rendered .item elements
        window.clearTimeout(this._initTimer);
        this._initTimer = window.setTimeout(() => {
            const slider = this.template.querySelector('.owl-carousel');
            if (slider && window.$ && this.files.length > 0) {
                const $slider = window.$(slider);

                if (this.isOwlInit) {
                    // destroy old instance first
                    $slider.trigger('destroy.owl.carousel');
                    $slider.classList.remove('owl-loaded');
                    $slider.querySelectorAll('.owl-stage-outer').forEach(el => el.remove());
                }

                $slider.owlCarousel({
                    items: 2,
                    loop: true,
                    margin: 10,
                    autoplay: true,
                    autoplayTimeout: 3000,
                    autoplayHoverPause: true,
                    nav: true,
                    dots: false,
                    smartSpeed: 600,
                    navText: [
                        '<i class="fa-solid fa-angle-left"></i>',
                        '<i class="fa-solid fa-angle-right"></i>'
                    ]
                });

                this.isOwlInit = true;
            }
        }, 300); // small delay so template children are rendered
    }


   fetchCampaign() {
    getEventCampaigns()
        .then(data => {
            const result = data.find(item => item.Id === this.campaignId);
            if (result) {

                this.formattedTimeRange = this.formatTimeRange(result.startDateTime, result.endDateTime, result.timeZone);
                this.formattedOnlyDateRange = this.formatOnlyDateRange(result.startDateTime, result.endDateTime, result.timeZone);
                this.formattedDateTimeRange = this.formatDateTimeRange(result.startDateTime, result.endDateTime, result.timeZone);

                                    
                        console.log('Street:', result.Street);
                        console.log('City:', result.City);
                        console.log('State:', result.StateCode);
                        console.log('Postal Code:', result.PostalCode);
                        console.log('Country Code:', result.CountryCode);

                        const addressParts = [
                            result.Street,
                            result.City,
                            result.StateCode,
                            result.PostalCode,
                            result.CountryCode
                        ].filter(Boolean);

                        if (addressParts.length > 0) {
                            this.mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(addressParts.join(', '))}&output=embed`;
                        } else {
                            this.mapUrl = '';
                        }


                      
                        console.log('Map URL:', this.mapUrl);


                                        this.campaign = result;
                                        console.log('this.campaign:', this.campaign);

                                        const event_detail_description = this.template.querySelector('.event_detail_description');
                                        if (event_detail_description) {
                                            event_detail_description.innerHTML = result.Description;
                                        }
            }
        })
        .catch(error => {
            console.error('Error fetching campaigns', error);
        });
}



//     formatDate(dateStr) {
//     if (!dateStr) {
//         console.warn('⚠️ formatDate called with empty dateStr:', dateStr);
//         return '';
//     }

//     let dt;

//     // Check if it's in dd/MM/yyyy format
//     if (dateStr.includes('/')) {
//         const [day, month, year] = dateStr.split('/');
//         dt = new Date(`${year}-${month}-${day}`); // convert to yyyy-MM-dd
//     } else {
//         dt = new Date(dateStr);
//     }

//     // Validate
//     if (isNaN(dt)) {
//         console.error('❌ Still invalid after conversion:', dateStr);
//         return '';
//     }

//     const dtf = new Intl.DateTimeFormat('en', {
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//     });

//     const parts = dtf.formatToParts(dt);
//     const day = parts.find(p => p.type === 'day').value;
//     const month = parts.find(p => p.type === 'month').value;
//     const year = parts.find(p => p.type === 'year').value;
//     const weekday = parts.find(p => p.type === 'weekday').value;

//     const finalFormatted = `${weekday}, ${month} ${day}, ${year}`;
//     console.log('✅ Final formatted date:', finalFormatted);

//     return finalFormatted;
// }

    formatDateTimeRange(startDt, endDt, timeZone) {
    if (!startDt || !endDt) return '';

    try {
        const start = new Date(startDt);
        const end = new Date(endDt);

        const dateFormatter = new Intl.DateTimeFormat('en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });

        const timeFormatter = new Intl.DateTimeFormat('en', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const formattedDate = dateFormatter.format(start);
        const formattedStartTime = timeFormatter.format(start);
        const formattedEndTime = timeFormatter.format(end);

        return `${formattedDate} | ${formattedStartTime} ${timeZone} to ${formattedEndTime} ${timeZone}`;
    } catch (e) {
        console.error('Error formatting datetime range:', e);
        return '';
    }
}

    formatTimeRange(startDt, endDt, timeZone) {
    if (!startDt || !endDt) return '';

    try {
        const start = new Date(startDt);
        const end = new Date(endDt);

        // const dateFormatter = new Intl.DateTimeFormat('en', {
        //     weekday: 'long',
        //     year: 'numeric',
        //     month: 'long',
        //     day: '2-digit'
        // });

        const timeFormatter = new Intl.DateTimeFormat('en', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        //const formattedDate = dateFormatter.format(start);
        const formattedStartTime = timeFormatter.format(start);
        const formattedEndTime = timeFormatter.format(end);

        return `${formattedStartTime} ${timeZone} to ${formattedEndTime} ${timeZone}`;
    } catch (e) {
        console.error('Error formatting datetime range:', e);
        return '';
    }
}

    formatOnlyDateRange(startDt, endDt, timeZone) {
    if (!startDt || !endDt) return '';

    try {
        const start = new Date(startDt);
        const end = new Date(endDt);

        const dateFormatter = new Intl.DateTimeFormat('en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });

        // const timeFormatter = new Intl.DateTimeFormat('en', {
        //     hour: '2-digit',
        //     minute: '2-digit',
        //     hour12: true
        // });

        const formattedDate = dateFormatter.format(start);
        // const formattedStartTime = timeFormatter.format(start);
        // const formattedEndTime = timeFormatter.format(end);

        return `${formattedDate}`;
    } catch (e) {
        console.error('Error formatting datetime range:', e);
        return '';
    }
}

    get isPaid() {
        return this.campaign.PaymentStatus === 'Paid';
    }

    get isUnpaid() {
        return this.campaign.PaymentStatus === 'UnPaid';
    }

    handleInput(event) {
        const label = event.target.label;
        if (label === 'Name') {
            this.userName = event.target.value;
        } else if (label === 'Email') {
            this.userEmail = event.target.value;
        }else if (label === 'Amount') {
            this.amount = event.target.value;
        }else if (label === 'PAN') {
            this.panNumber = event.target.value;
        }
    }

    handlePayNow() {

         if (!this.userName || !this.userEmail || !this.amount || !this.panNumber) {
        // You can use toast or just alert
        alert('Please fill all the required fields.');
        return; // Stop execution
    }
    
        console.log('Pay Now for:', this.campaign.Name, 'User:', this.userName, this.userEmail);
          
  const amount = this.amount; // For ₹500
    const vfPageUrl = '/apex/RazorpayEventPaymentPage?amount=' + amount ;
    //window.open(vfPageUrl, '_blank');
    window.location.href = vfPageUrl;
    }

  

    handleRegister() {
        console.log('Register for:', this.campaign.Name, 'User:', this.userName, this.userEmail);
        
    }
}
